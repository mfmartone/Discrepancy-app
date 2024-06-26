const express = require('express');
const multer = require('multer');
const path = require('path');
const { processExcelFile } = require('./processExcel');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));

// Endpoint per il template (modifica con il percorso effettivo del template)
app.get('/template', (req, res) => {
    res.download('public/data/template.xlsx', 'template.xlsx');
});

// Endpoint per il caricamento dei file
app.post('/upload', upload.single('file'), (req, res) => {
    const inputFilePath = req.file.path;
    const outputFilePath = path.join(__dirname, 'public', 'discrepancy_report.xlsx');

    try {
        // Processare il file Excel
        processExcelFile(inputFilePath, outputFilePath);

        // Restituire la risposta con il percorso del report generato
        res.json({ 
            message: 'File processed successfully.',
            reportUrl: '/discrepancy_report.xlsx' 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error during file processing.' });
    }
});

// Avvio del server
app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});
