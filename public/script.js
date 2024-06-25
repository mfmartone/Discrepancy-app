document.addEventListener('DOMContentLoaded', function() {
    const userLang = navigator.language || navigator.userLanguage;
    const lang = userLang.startsWith('it') ? 'it' : 'en';

    // Funzione per applicare le traduzioni
    function applyTranslations(lang) {
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            if (translations[lang][key]) {
                element.textContent = translations[lang][key];
            }
        });
    }

    // Applicare le traduzioni all'inizio
    applyTranslations(lang);

    const fileInput = document.getElementById('fileInput');
    const fileNameSpan = document.getElementById('fileName');
    const removeFileButton = document.getElementById('removeFile');
    const uploadButton = document.querySelector('.upload-button');
    const progressBar = document.getElementById('progressBar');
    const progressContainer = document.getElementById('progressContainer');
    const resultDiv = document.getElementById('result');
    const uploadForm = document.getElementById('uploadForm');

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
                resultDiv.innerHTML = `<p>${result.message}</p><a href="${result.reportUrl}" download>Scarica il rapporto</a>`;
            } else {
                resultDiv.innerHTML = `<p>Errore: ${result.message}</p>`;
            }
        } catch (error) {
            console.error('Errore durante il caricamento del file:', error);
            resultDiv.innerHTML = '<p>Errore durante il caricamento del file. Per favore riprova.</p>';
        } finally {
            // Hide progress bar after upload completes
            setTimeout(() => {
                progressContainer.style.display = 'none';
                progressBar.style.width = '0%';
            }, 2000); // Show the complete bar for a moment before hiding
        }
    });

    document.getElementById('downloadTemplate').addEventListener('click', function() {
        window.location.href = '/template';
    });

    function resetFileInput() {
        fileInput.value = '';
        fileNameSpan.textContent = '';
        removeFileButton.style.display = 'none';
        uploadButton.disabled = true;
    }
});
