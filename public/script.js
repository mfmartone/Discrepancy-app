document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    const fileNameSpan = document.getElementById('fileName');
    const removeFileButton = document.getElementById('removeFile');
    const uploadButton = document.querySelector('.upload-button');
    const progressBar = document.getElementById('progressBar');
    const progressContainer = document.getElementById('progressContainer');
    const resultDiv = document.getElementById('result');
    const uploadForm = document.getElementById('uploadForm');
    const downloadTemplateButton = document.getElementById('downloadTemplate');

    // Definizione delle traduzioni in base alla lingua del browser
    const translations = {
        en: {
            app_title: 'Discrepancy Report Generator',
            select_file_label: 'Select Excel File',
            remove_file_button: 'Remove',
            upload_button: 'Upload and Process',
            download_template_button: 'Download Template'
        },
        it: {
            app_title: 'Generatore di Rapporti di Discrepanze',
            select_file_label: 'Seleziona il file Excel',
            remove_file_button: 'Rimuovi',
            upload_button: 'Carica e Processa',
            download_template_button: 'Scarica il Template'
        }
        // Aggiungere altre traduzioni secondo necessità
    };

    // Funzione per ottenere la lingua preferita dell'utente dal browser
    function getPreferredLanguage() {
        return navigator.language.split('-')[0]; // Ottiene solo il codice della lingua (es. 'en' da 'en-US')
    }

    // Funzione per tradurre tutti gli elementi con attributo data-i18n
    function translateUI(language) {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (translations[language] && translations[language][key]) {
                element.textContent = translations[language][key];
            }
        });
    }

    // Inizializza la traduzione in base alla lingua del browser
    const userLanguage = getPreferredLanguage();
    translateUI(userLanguage);

    // Aggiorna la traduzione se cambia la lingua del browser
    document.addEventListener('languagechange', function() {
        const newLanguage = getPreferredLanguage();
        translateUI(newLanguage);
    });

    fileInput.addEventListener('change', function() {
        if (fileInput.files.length > 0) {
            fileNameSpan.textContent = fileInput.files[0].name;
            removeFileButton.style.display = 'inline-block';
            uploadButton.disabled = false;
        } else {
            resetFileInput();
        }
    });

    removeFileButton.addEventListener('click', function() {
        resetFileInput();
    });

    uploadForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const formData = new FormData(this);

        // Reset progress bar
        progressBar.style.width = '0%';
        progressContainer.style.display = 'block';
        resultDiv.innerHTML = '';

        try {
            // Start upload request
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            // Simulate progress (for example purposes, not actually linked to upload progress)
            for (let i = 0; i <= 100; i++) {
                setTimeout(() => {
                    progressBar.style.width = i + '%';
                }, i * 20); // Increase interval for slower, visible progression
            }

            const result = await response.json();

            if (response.ok) {
                resultDiv.innerHTML = `<p>${result.message}</p><a href="${result.reportUrl}" download>Download Report</a>`;
            } else {
                resultDiv.innerHTML = `<p>Error: ${result.message}</p>`;
            }
        } catch (error) {
            console.error('Error during file upload:', error);
            resultDiv.innerHTML = '<p>Error during file upload. Please try again.</p>';
        } finally {
            // Hide progress bar after upload completes
            setTimeout(() => {
                progressContainer.style.display = 'none';
                progressBar.style.width = '0%';
            }, 2000); // Show the complete bar for a moment before hiding
        }
    });

    downloadTemplateButton.addEventListener('click', function() {
        window.location.href = '/template';
    });

    function resetFileInput() {
        fileInput.value = '';
        fileNameSpan.textContent = '';
        removeFileButton.style.display = 'none';
        uploadButton.disabled = true;
    }
});
