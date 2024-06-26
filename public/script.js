document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('file-input');
    const selectFileButton = document.getElementById('select-file-button');
    const uploadButton = document.getElementById('upload-button');
    const removeButton = document.getElementById('remove-button');
    const downloadReportButton = document.getElementById('download-report');
    const fileNameDisplay = document.getElementById('file-name');
    const progressBar = document.getElementById('progress-bar');
    const progressBarInner = progressBar.querySelector('.progress-bar');
    const statusMessage = document.getElementById('status-message');

    let selectedFile = null;

    // Listener per aprire la finestra di selezione file
    selectFileButton.addEventListener('click', function() {
        fileInput.click();
    });

    fileInput.addEventListener('change', function(event) {
        selectedFile = event.target.files[0];
        if (selectedFile) {
            fileNameDisplay.textContent = selectedFile.name;
            uploadButton.disabled = false; // Abilita il bottone "Carica e Processa"
            removeButton.style.display = 'inline'; // Mostra il bottone "Rimuovi"
        } else {
            fileNameDisplay.textContent = '';
            uploadButton.disabled = true;
            removeButton.style.display = 'none';
        }
    });

    removeButton.addEventListener('click', function() {
        fileInput.value = ''; // Resetta il valore dell'input
        fileNameDisplay.textContent = ''; // Pulisce il nome del file visualizzato
        uploadButton.disabled = true; // Disabilita il bottone "Carica e Processa"
        removeButton.style.display = 'none'; // Nasconde il bottone "Rimuovi"
        selectedFile = null;
    });

    uploadButton.addEventListener('click', async function() {
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            // Reset dello stato
            statusMessage.textContent = '';
            progressBar.style.display = 'block';
            progressBarInner.style.width = '0%';
            progressBarInner.textContent = '0%';

            const response = await fetch('/upload', {
                method: 'POST',
                body: formData,
                // Indica al server che stiamo inviando un file Excel
                headers: {
                    'Accept': 'application/json'
                }
            });

            const result = await response.json();

            if (response.ok) {
                // Imposta il progresso al 100%
                progressBarInner.style.width = '100%';
                progressBarInner.textContent = '100%';

                statusMessage.textContent = result.message;

                // Mostra il link per scaricare il report
                if (result.downloadLink) {
                    downloadReportButton.setAttribute('href', result.downloadLink);
                    downloadReportButton.style.display = 'inline-block';
                }
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            statusMessage.textContent = `Error during file upload: ${error.message}`;
            console.error('Error during file upload:', error);
        }
    });

    // Disabilita il bottone "Carica e Processa" se non è stato selezionato un file
    uploadButton.disabled = true;
    removeButton.style.display = 'none'; // Nasconde il bottone "Rimuovi" all'inizio
});