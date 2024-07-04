const XLSX = require('xlsx');
const path = require('path');

// Funzione per processare il file Excel
function processExcelFile(inputFilePath, outputFilePath) {
    // Leggere il file Excel caricato
    const workbook = XLSX.readFile(inputFilePath);

    // Leggere il file Item Master (situato in /public/data/item master.xlsx)
    const itemMasterPath = path.join(__dirname, 'public', 'data', 'item master.xlsx');
    const itemMasterWorkbook = XLSX.readFile(itemMasterPath);
    const wsItemMaster = itemMasterWorkbook.Sheets['Item Master'];
    const itemMasterData = XLSX.utils.sheet_to_json(wsItemMaster, { header: 1, raw: false });

    // Creare una mappa per cercare rapidamente l'UPC nel foglio Item Master
    const itemMasterMap = new Map();
    for (let i = 1; i < itemMasterData.length; i++) {
        const row = itemMasterData[i];
        const upc = String(row[0]);
        itemMasterMap.set(upc, {
            SKU: row[1] || '',
            Category: row[2] || '',
            Subcategory: row[3] || ''
        });
    }

    // Ottenere i fogli "Item Count" e "Inventory Manager"
    const wsItemCount = workbook.Sheets['Item Count'];
    const wsInventoryManager = workbook.Sheets['Inventory Manager'];

    // Ottenere i dati dai fogli
    const itemCountData = XLSX.utils.sheet_to_json(wsItemCount, { header: 1, raw: false });
    const inventoryManagerData = XLSX.utils.sheet_to_json(wsInventoryManager, { header: 1, raw: false });

    // Creare il foglio "Discrepancy"
    let discrepancyData = [
        ["UPC", "Item Count Availability", "Item Count Consigned", "Inventory Manager Availability", "Inventory Manager Consigned", "Difference Availability", "Difference Consigned", "SKU", "Category", "Subcategory"]
    ];

    // Funzione di supporto per trovare una riga tramite UPC (trattato come stringa)
    const findRowByUPC = (data, upc) => data.find(row => String(row[0]) === String(upc));

    // Processare i dati "Item Count"
    for (let i = 1; i < itemCountData.length; i++) {
        const itemCountRow = itemCountData[i];
        const upc = String(itemCountRow[0]);
        const itemCountAvailability = parseFloat(itemCountRow[1]) || 0;
        const itemCountConsigned = parseFloat(itemCountRow[2]) || 0;

        // Trovare la riga corrispondente nell'Inventory Manager
        const foundRow = findRowByUPC(inventoryManagerData, upc);

        let inventoryManagerAvailability = 0;
        let inventoryManagerConsigned = 0;
        let sku = '';
        let category = '';
        let subcategory = '';

        if (foundRow) {
            inventoryManagerAvailability = parseFloat(foundRow[1]) || 0;
            inventoryManagerConsigned = parseFloat(foundRow[2]) || 0;
        }

        const differenceAvailability = inventoryManagerAvailability - itemCountAvailability;
        const differenceConsigned = inventoryManagerConsigned - itemCountConsigned;

        // Recuperare i dati dal Item Master se disponibili
        if (itemMasterMap.has(upc)) {
            const masterData = itemMasterMap.get(upc);
            sku = masterData.SKU;
            category = masterData.Category;
            subcategory = masterData.Subcategory;
        }

        // Aggiungere i dati al foglio "Discrepancy"
        discrepancyData.push([
            upc,
            String(itemCountAvailability),
            String(itemCountConsigned),
            String(inventoryManagerAvailability),
            String(inventoryManagerConsigned),
            String(differenceAvailability),
            String(differenceConsigned),
            sku,
            category,
            subcategory
        ]);
    }

    // Processare i dati "Inventory Manager" per trovare UPC non presenti in "Item Count"
    for (let i = 1; i < inventoryManagerData.length; i++) {
        const inventoryManagerRow = inventoryManagerData[i];
        const upc = String(inventoryManagerRow[0]);
        if (!findRowByUPC(itemCountData, upc)) {
            const inventoryManagerAvailability = parseFloat(inventoryManagerRow[1]) || 0;
            const inventoryManagerConsigned = parseFloat(inventoryManagerRow[2]) || 0;

            let sku = '';
            let category = '';
            let subcategory = '';

            // Recuperare i dati dal Item Master se disponibili
            if (itemMasterMap.has(upc)) {
                const masterData = itemMasterMap.get(upc);
                sku = masterData.SKU;
                category = masterData.Category;
                subcategory = masterData.Subcategory;
            }

            discrepancyData.push([
                upc,
                "0",
                "0",
                String(inventoryManagerAvailability),
                String(inventoryManagerConsigned),
                String(inventoryManagerAvailability),
                String(inventoryManagerConsigned),
                sku,
                category,
                subcategory
            ]);
        }
    }

    // Convertire i dati del "Discrepancy" in un foglio di lavoro
    const wsDiscrepancy = XLSX.utils.aoa_to_sheet(discrepancyData);

    // Aggiornare il workbook solo con il foglio "Discrepancy"
    const newWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWorkbook, wsDiscrepancy, 'Discrepancy');

    // Scrivere il file Excel aggiornato
    XLSX.writeFile(newWorkbook, outputFilePath);

    console.log("Discrepancy report generated successfully.");
}

module.exports = { processExcelFile };
