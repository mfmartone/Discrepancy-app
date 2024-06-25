const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();

// Serve static files from the "public" directory
app.use(express.static('public'));

// Configure Multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Route for handling file uploads
app.post('/upload', upload.single('file'), (req, res) => {
    // Get the uploaded file
    const file = req.file;

    if (!file) {
        return res.status(400).send({ message: 'Nessun file caricato.' });
    }

    // Placeholder for processing the Excel file
    // Here you would call a function to process the uploaded file and generate the report
    // For this example, we are assuming that the processing is done and the report is generated
    const reportUrl = '/path/to/generated/report.xlsx';  // Placeholder path to the generated report

    // Simulate processing time
    setTimeout(() => {
        res.send({ message: 'File elaborato con successo.', reportUrl: reportUrl });
    }, 2000); // Simula un ritardo di 2 secondi per l'elaborazione
});

// Route for downloading the template
app.get('/template', (req, res) => {
    const templatePath = path.join(__dirname, 'public', 'template.xlsx');
    res.download(templatePath, 'template.xlsx', (err) => {
        if (err) {
            console.error('Errore durante il download del template:', err);
            res.status(500).send('Errore durante il download del template.');
        }
    });
});

// Start the server
const port = 3000;
app.listen(port, () => {
    console.log(`Server avviato su http://localhost:${port}`);
});
