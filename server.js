const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const ExcelJS = require('exceljs');

const app = express();
const PORT = 3000;

app.use(fileUpload());
app.use(express.static('public'));

// Endpoint per servire la pagina principale
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint per servire le traduzioni
app.get('/translations', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'translations.json'));
});

// Endpoint per scaricare il template Excel
app.get('/template', (req, res) => {
    res.download(path.join(__dirname, 'template.xlsx'), 'template.xlsx');
});

// Endpoint per ottenere il nome del file caricato
app.get('/filename', (req, res) => {
    if (req.query.filename) {
        res.json({ filename: req.query.filename });
    } else {
        res.status(400).json({ message: 'File name not found.' });
    }
});

// Endpoint per gestire il caricamento del file Excel e generare il rapporto di discrepanze
app.post('/upload', async (req, res) => {
    if (!req.files || !req.files.file) {
        return res.status(400).send({ message: 'No file uploaded.' });
    }

    const file = req.files.file;
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.data);

    const itemMaster = workbook.getWorksheet('Item Master');
    const inventoryManager = workbook.getWorksheet('Inventory Manager');
    const inventoryCount = workbook.getWorksheet('Inventory Count');

    // Elaborazione dati da Item Master
    const items = itemMaster.getSheetValues().slice(2).map(row => ({
        UPC: row[1],
        SKU: row[2],
        Category: row[3],
        Subcategory: row[4]
    }));

    // Elaborazione dati da Inventory Manager
    const inventoryManagerData = inventoryManager.getSheetValues().slice(2).map(row => ({
        UPC: row[1],
        InventoryManagerAvailability: row[2],
        InventoryManagerConsigned: row[3]
    }));

    // Elaborazione dati da Inventory Count
    const inventoryCountData = inventoryCount.getSheetValues().slice(2).map(row => ({
        UPC: row[1],
        InventoryCountAvailability: row[2],
        InventoryCountConsigned: row[3]
    }));

    // Creazione del rapporto di discrepanze
    const discrepancyReport = items.map(item => {
        const imData = inventoryManagerData.find(im => im.UPC === item.UPC) || {};
        const icData = inventoryCountData.find(ic => ic.UPC === item.UPC) || {};

        return {
            ...item,
            InventoryCountAvailability: icData.InventoryCountAvailability || 0,
            InventoryCountConsigned: icData.InventoryCountConsigned || 0,
            InventoryManagerAvailability: imData.InventoryManagerAvailability || 0,
            InventoryManagerConsigned: imData.InventoryManagerConsigned || 0,
            DifferenceAvailability: (imData.InventoryManagerAvailability || 0) - (icData.InventoryCountAvailability || 0),
            DifferenceConsigned: (imData.InventoryManagerConsigned || 0) - (icData.InventoryCountConsigned || 0)
        };
    });

    const reportWorkbook = new ExcelJS.Workbook();
    const reportWorksheet = reportWorkbook.addWorksheet('Discrepancy Report');
    reportWorksheet.columns = [
        { header: 'UPC', key: 'UPC' },
        { header: 'Item Count Availability', key: 'InventoryCountAvailability' },
        { header: 'Item Count Consigned', key: 'InventoryCountConsigned' },
        { header: 'Inventory Manager Availability', key: 'InventoryManagerAvailability' },
        { header: 'Inventory Manager Consigned', key: 'InventoryManagerConsigned' },
        { header: 'Difference Availability', key: 'DifferenceAvailability' },
        { header: 'Difference Consigned', key: 'DifferenceConsigned' },
        { header: 'SKU', key: 'SKU' },
        { header: 'Category', key: 'Category' },
        { header: 'Subcategory', key: 'Subcategory' }
    ];

    discrepancyReport.forEach(data => {
        reportWorksheet.addRow(data);
    });

    const buffer = await reportWorkbook.xlsx.writeBuffer();

    // Invia il nome del file e il rapporto generato come risposta
    res.send({
        message: 'File processed successfully.',
        reportUrl: '/download/report.xlsx',
        data: discrepancyReport // Invio dei dati della tabella
    });

    // Endpoint per scaricare il rapporto di discrepanze
    app.get('/download/report.xlsx', (req, res) => {
        res.setHeader('Content-Disposition', 'attachment; filename=report.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    });
});

// Avvia il server
app.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
});
