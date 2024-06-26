const XLSX = require('xlsx');
const path = require('path');

function processExcelFile(inputFilePath, outputFilePath) {
    // Leggere il file Excel principale (Item Count e Inventory Manager)
    const workbook = XLSX.readFile(inputFilePath);

    // Ottenere il foglio "Item Count"
    const wsItemCount = workbook.Sheets['Item Count'];
    const itemCountData = XLSX.utils.sheet_to_json(wsItemCount, { header: 1, raw: false });

    // Ottenere il foglio "Inventory Manager"
    const wsInventoryManager = workbook.Sheets['Inventory Manager'];
    const inventoryManagerData = XLSX.utils.sheet_to_json(wsInventoryManager, { header: 1, raw: false });

    // Leggere il file "Item Master"
    const itemMasterFilePath = path.join(__dirname, '/public/data/item master.xlsx');
    const itemMasterWorkbook = XLSX.readFile(itemMasterFilePath);
    const wsItemMaster = itemMasterWorkbook.Sheets[itemMasterWorkbook.SheetNames[0]]; // Assuming only one sheet
    const itemMasterData = XLSX.utils.sheet_to_json(wsItemMaster, { header: 1, raw: false });

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

        // Inizializzare le informazioni da Item Master
        let sku = "";
        let category = "";
        let subcategory = "";

        // Trovare la riga corrispondente nell'Item Master
        const itemMasterRow = findRowByUPC(itemMasterData, upc);
        if (itemMasterRow) {
            sku = itemMasterRow[1]; // Indice di SKU nel foglio Item Master
            category = itemMasterRow[2]; // Indice di Category nel foglio Item Master
            subcategory = itemMasterRow[3]; // Indice di Subcategory nel foglio Item Master
        }

        // Aggiungere i dati al foglio "Discrepancy"
        if (foundRow) {
            const inventoryManagerAvailability = parseFloat(foundRow[1]) || 0;
            const inventoryManagerConsigned = parseFloat(foundRow[2]) || 0;

            const differenceAvailability = inventoryManagerAvailability - itemCountAvailability;
            const differenceConsigned = inventoryManagerConsigned - itemCountConsigned;

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
        } else {
            // Se non trova corrispondenza, riporta i valori dall'Item Count e 0 per Inventory Manager
            discrepancyData.push([
                upc,
                String(itemCountAvailability),
                String(itemCountConsigned),
                "0",
                "0",
                String(0 - itemCountAvailability),
                String(0 - itemCountConsigned),
                sku,
                category,
                subcategory
            ]);
        }
    }

    // Convertire i dati del "Discrepancy" in un foglio di lavoro
    const wsDiscrepancy = XLSX.utils.aoa_to_sheet(discrepancyData);
    workbook.SheetNames = ['Discrepancy']; // Imposta solo il foglio "Discrepancy"
    workbook.Sheets['Discrepancy'] = wsDiscrepancy;

    // Scrivere il file Excel aggiornato
    XLSX.writeFile(workbook, outputFilePath);

    console.log("Discrepancy report generated successfully.");
}

module.exports = { processExcelFile };
