import express, { Request, Response } from "express";
import prisma from "./db.js"; // Tu instancia centralizada de Prisma
import { DocumentStatus } from "@prisma/client";
import axios from "axios";
import cors from "cors";
const app = express();
const PORT = 3000;

app.use(express.json());

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://btp-document-approval-engine.netlify.app"
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.get("/", (req: Request, res: Response) => {
  res.send("Hola Mundo con TypeScript");
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Enviar documento
app.post("/documents", async (req: Request, res: Response) => {
  try {
    const { supplierName, amount, date, description } = req.body;

    const newDocument = await prisma.document.create({
      data: {
        supplierName,
        amount: Number(amount),
        date: new Date(date),
        description: description || null,
        status: DocumentStatus.DRAFT,
        approvalLevelRequired: 0,
        currentApprovalStep: 0,
      },
    });
    res.status(201).json(newDocument);
  } catch (error: any) {
    console.error("Error al crear documento:", error);

    res.status(500).json({
      error: "Error interno del servidor",
      details: error.message,
    });
  }
});

// Mostrar todos los documentos
app.get("/documents", async (req: Request, res: Response) => {
  try {
    const docs = await prisma.document.findMany({});
    res.status(201).json(docs);
  } catch (error: any) {
    console.error("Error al crear documento:", error);

    res.status(500).json({
      error: "Error interno del servidor",
      details: error.message,
    });
  }
});

// Mostrar un documento
app.get("/documents/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const documentId = parseInt(id as string);

    if (isNaN(documentId)) {
      return res.status(400).json({ error: "El ID debe ser un número válido" });
    }

    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return res.status(404).json({ error: "Documento no encontrado" });
    }

    res.json(document);
  } catch (error: any) {
    console.error("Error al crear documento:", error);

    res.status(500).json({
      error: "Error interno del servidor",
      details: error.message,
    });
  }
});

// Enviar documento
app.post("/documents/:id/submit", async (req: Request, res: Response) => {
  try {

    let docStatus: DocumentStatus = DocumentStatus.DRAFT;
    let approvalLevelRequired: number = 0;
    
    const { id } = req.params;
    const documentid = parseInt(id as string);

    if (isNaN(documentid)) {
      return res.status(400).json({ error: "El ID debe ser un número válido" });
    }
    const document = await prisma.document.findUnique({
      where: { id: documentid },
    });

    if (!document) {
      return res.status(404).json({ error: "Documento no encontrado" });
    }
    if (document.status !== DocumentStatus.DRAFT) {
        return res.status(400).json({ error: "Solo se pueden enviar documentos en estado DRAFT" });
    }

    if (Number(document.amount) < 1000) {
      docStatus = DocumentStatus.AUTO_APPROVED;
    } else {
      docStatus = DocumentStatus.PENDING_APPROVAL;

      if (Number(document.amount) < 5000) {
        approvalLevelRequired = 1;
      } else {
        approvalLevelRequired = 2;
      }
    }

    const updatedDocument = await prisma.document.update({
      where: { id: documentid },
      data: {
        status: docStatus,
        approvalLevelRequired: approvalLevelRequired,
      },
    });

    if (docStatus === DocumentStatus.PENDING_APPROVAL) {
      try {
        // 1. Obtener Token de SAP
        const authUrl = "https://b331c56btrial.authentication.us10.hana.ondemand.com/oauth/token?grant_type=client_credentials";
        const clientId = "sb-8bbcbad9-7516-469a-a1ad-428beb24d82d!b629030|xsuaa!b49390";
        const clientSecret = "a0f065b4-00b3-45e4-91c6-e72fd6aed915$i-Mho4D5vOUxM0cQsevMbwgNZGEkOo7u7zd-ZmmvL1o=";

        const authResponse = await axios.post(authUrl, null, {
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
          }
        });

        const accessToken = authResponse.data.access_token;

        const workflowUrl = "https://spa-api-gateway-bpi-us-prod.cfapps.us10.hana.ondemand.com/workflow/rest/v1/workflow-instances";
        
        await axios.post(workflowUrl, {
          definitionId: "us10.b331c56btrial.btpdocumentapprovalworkflow.approvalProcess",
          context: {
            documentid: updatedDocument.id, // Usamos el ID del documento actualizado
            suppliername: updatedDocument.supplierName, // Ajusta según tus campos de Prisma
            amount: Number(updatedDocument.amount)
          }
        }, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        console.log(`Workflow disparado para el documento ${documentid}`);
      } catch (workflowError: any) {
        console.error("Error disparando SAP Workflow:", workflowError.response?.data || workflowError.message);
      }
    }

    res.status(200).json(updatedDocument);
  } catch (error: any) {
    console.error("Error al crear documento:", error);

    res.status(500).json({
      error: "Error interno del servidor",
      details: error.message,
    });
  }
});

// Aprobar documento
app.post("/documents/:id/approve", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const documentId = parseInt(id as string);

    if (isNaN(documentId)) {
      return res.status(400).json({ error: "El ID debe ser un número válido" });
    }
    
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return res.status(404).json({ error: "Documento no encontrado" });
    }

    if (document.status !== DocumentStatus.PENDING_APPROVAL) {
        return res.status(400).json({ error: "Solo se pueden aprobar documentos en estado PENDING_APPROVAL o APPROVED" });
    }

    let updatedDocument;
    document.currentApprovalStep++;

    if(document.currentApprovalStep === document.approvalLevelRequired){
      updatedDocument = await prisma.document.update({
        where: { id: documentId },
        data: {
          status: DocumentStatus.APPROVED,
          currentApprovalStep: document.currentApprovalStep
        },
      });
    }else{
      updatedDocument = await prisma.document.update({
        where: { id: documentId },
        data: {
          currentApprovalStep: document.currentApprovalStep
        },
      });
    }

    res.status(200).json(updatedDocument);
  } catch (error: any) {
    console.error("Error al crear documento:", error);

    res.status(500).json({
      error: "Error interno del servidor",
      details: error.message,
    });
  }
});

// Rechazar documento
app.post("/documents/:id/reject", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const documentId = parseInt(id as string);

    if (isNaN(documentId)) {
      return res.status(400).json({ error: "El ID debe ser un número válido" });
    }

    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return res.status(404).json({ error: "Documento no encontrado" });
    }
    if (document.status !== DocumentStatus.PENDING_APPROVAL) {
        return res.status(400).json({ error: "Solo se pueden rechazar documentos en estado PENDING_APPROVAL" });
    }
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        status: DocumentStatus.REJECTED
      },
    });

    res.status(200).json(updatedDocument);
  } catch (error: any) {
    console.error("Error al crear documento:", error);

    res.status(500).json({
      error: "Error interno del servidor",
      details: error.message,
    });
  }
});