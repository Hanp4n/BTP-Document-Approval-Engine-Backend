var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import express from "express";
import prisma from "./db.js"; // Tu instancia centralizada de Prisma
import { DocumentStatus } from "@prisma/client";
const app = express();
const PORT = 3000;
app.use(express.json());
app.get("/", (req, res) => {
    res.send("Hola Mundo con TypeScript");
});
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
// Enviar documento
app.post("/documents", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { supplierName, amount, date, description } = req.body;
        const newDocument = yield prisma.document.create({
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
    }
    catch (error) {
        console.error("Error al crear documento:", error);
        res.status(500).json({
            error: "Error interno del servidor",
            details: error.message,
        });
    }
}));
// Mostrar todos los documentos
app.get("/documents", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const docs = yield prisma.document.findMany({});
        res.status(201).json(docs);
    }
    catch (error) {
        console.error("Error al crear documento:", error);
        res.status(500).json({
            error: "Error interno del servidor",
            details: error.message,
        });
    }
}));
// Mostrar un documento
app.get("/documents/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const documentId = parseInt(id);
        if (isNaN(documentId)) {
            return res.status(400).json({ error: "El ID debe ser un número válido" });
        }
        const document = yield prisma.document.findUnique({
            where: { id: documentId },
        });
        if (!document) {
            return res.status(404).json({ error: "Documento no encontrado" });
        }
        res.json(document);
    }
    catch (error) {
        console.error("Error al crear documento:", error);
        res.status(500).json({
            error: "Error interno del servidor",
            details: error.message,
        });
    }
}));
// Enviar documento
app.post("/documents/:id/submit", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { supplierName, amount, date, description } = req.body;
        let docStatus = DocumentStatus.DRAFT;
        let approvalLevelRequired = 0;
        const { id } = req.params;
        const documentId = parseInt(id);
        if (isNaN(documentId)) {
            return res.status(400).json({ error: "El ID debe ser un número válido" });
        }
        const document = yield prisma.document.findUnique({
            where: { id: documentId },
        });
        if (!document) {
            return res.status(404).json({ error: "Documento no encontrado" });
        }
        if (document.status !== DocumentStatus.DRAFT) {
            return res.status(400).json({ error: "Solo se pueden enviar documentos en estado DRAFT" });
        }
        if (amount < 1000) {
            docStatus = DocumentStatus.AUTO_APPROVED;
        }
        else {
            docStatus = DocumentStatus.PENDING_APPROVAL;
            if (amount < 5000) {
                approvalLevelRequired = 1;
            }
            else {
                approvalLevelRequired = 2;
            }
        }
        const updatedDocument = yield prisma.document.update({
            where: { id: documentId },
            data: {
                supplierName,
                amount: Number(amount),
                date: new Date(date),
                description: description || null,
                status: docStatus,
                approvalLevelRequired: approvalLevelRequired,
            },
        });
        res.status(200).json(updatedDocument);
    }
    catch (error) {
        console.error("Error al crear documento:", error);
        res.status(500).json({
            error: "Error interno del servidor",
            details: error.message,
        });
    }
}));
// Aprobar documento
app.post("/documents/:id/approve", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const documentId = parseInt(id);
        if (isNaN(documentId)) {
            return res.status(400).json({ error: "El ID debe ser un número válido" });
        }
        const document = yield prisma.document.findUnique({
            where: { id: documentId },
        });
        if (!document) {
            return res.status(404).json({ error: "Documento no encontrado" });
        }
        if (document.status !== DocumentStatus.PENDING_APPROVAL) {
            return res.status(400).json({ error: "Solo se pueden aprobar documentos en estado PENDING_APPROVAL" });
        }
        let updatedDocument;
        document.currentApprovalStep++;
        if (document.currentApprovalStep === document.approvalLevelRequired) {
            updatedDocument = yield prisma.document.update({
                where: { id: documentId },
                data: {
                    status: DocumentStatus.APPROVED,
                    currentApprovalStep: document.currentApprovalStep
                },
            });
        }
        else {
            updatedDocument = yield prisma.document.update({
                where: { id: documentId },
                data: {
                    currentApprovalStep: document.currentApprovalStep
                },
            });
        }
        res.status(200).json(updatedDocument);
    }
    catch (error) {
        console.error("Error al crear documento:", error);
        res.status(500).json({
            error: "Error interno del servidor",
            details: error.message,
        });
    }
}));
// Rechazar documento
app.post("/documents/:id/reject", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const documentId = parseInt(id);
        if (isNaN(documentId)) {
            return res.status(400).json({ error: "El ID debe ser un número válido" });
        }
        const document = yield prisma.document.findUnique({
            where: { id: documentId },
        });
        if (!document) {
            return res.status(404).json({ error: "Documento no encontrado" });
        }
        if (document.status !== DocumentStatus.PENDING_APPROVAL) {
            return res.status(400).json({ error: "Solo se pueden rechazar documentos en estado PENDING_APPROVAL" });
        }
        const updatedDocument = yield prisma.document.update({
            where: { id: documentId },
            data: {
                status: DocumentStatus.REJECTED
            },
        });
        res.status(200).json(updatedDocument);
    }
    catch (error) {
        console.error("Error al crear documento:", error);
        res.status(500).json({
            error: "Error interno del servidor",
            details: error.message,
        });
    }
}));
//# sourceMappingURL=index.js.map