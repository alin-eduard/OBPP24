document.addEventListener('DOMContentLoaded', async function() {
    console.log('Script loaded'); // Confirmăm că scriptul a fost încărcat

    fetch('config.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Rețea de erori la încărcarea fișierului JSON');
            }
            return response.json();
        })
        .then(data => {
            console.log('JSON data:', data); // Verificăm dacă datele sunt încărcate corect

            const content = document.getElementById('content');
            const instrumente = ['Mandolina', 'Vioara 1', 'Vioara 2', 'Chitara'];

            data.cantari.forEach(cantare => {
                const section = document.createElement('section');
                section.classList.add('category');

                const title = document.createElement('h2');
                title.classList.add('category-title');
                title.textContent = cantare;

                const list = document.createElement('div');
                list.classList.add('category-content');

                const mergeLink = document.createElement('a');
                mergeLink.textContent = "All";
                mergeLink.href = '#';
                mergeLink.classList.add('merge-link');

                // Adăugăm linkuri individuale pentru fiecare instrument
                instrumente.forEach(instrument => {
                    const folder = instrument.toLowerCase().replace(' ', '');
                    const link = document.createElement('a');
                    link.href = `resources/${folder}/${cantare}.pdf`;
                    link.target = '_blank';
                    link.textContent = instrument;
                    list.appendChild(link);
                });

                section.appendChild(title);
                section.appendChild(list);
                content.appendChild(section);

                list.appendChild(mergeLink);

                // Adăugăm funcționalitatea de combinare la apăsarea pe "All"
                mergeLink.addEventListener('click', async function(e) {
                    e.preventDefault();

                    const mergedPdf = await PDFLib.PDFDocument.create();
                    mergedPdf.setTitle(cantare);

                    // Încărcăm și combinăm PDF-urile
                    for (const instrument of instrumente) {
                        const folder = instrument.toLowerCase().replace(' ', '');
                        const pdfUrl = `resources/${folder}/${cantare}.pdf`;

                        try {
                            // Fetch cu verificarea existenței fișierului
                            const response = await fetch(pdfUrl);

                            if (!response.ok) {
                                console.warn(`Fișierul nu a fost găsit la: ${pdfUrl}`);
                                continue;
                            }

                            // Dacă fișierul există, preluăm și combinăm PDF-urile
                            const existingPdfBytes = await response.arrayBuffer();
                            const pdf = await PDFLib.PDFDocument.load(existingPdfBytes);
                            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());

                            copiedPages.forEach(page => mergedPdf.addPage(page));
                        } catch (error) {}
                    }

                    // Salvăm și deschidem PDF-ul combinat
                    const mergedPdfBytes = await mergedPdf.save();
                    const blob = new Blob([mergedPdfBytes], {
                        type: 'application/pdf'
                    });
                    const blobUrl = URL.createObjectURL(blob);
                    window.open(blobUrl); // Deschidem PDF-ul combinat într-o pagină nouă
                });

                // Toggle pentru a afișa/ascunde lista de instrumente
                title.addEventListener('click', function() {
                    list.style.display = list.style.display === 'flex' ? 'none' : 'flex';
                });
            });

            // Actualizare text pentru data ultimei modificări
            const contentLastUpdate = document.getElementById('last-update');
            contentLastUpdate.textContent = "Updated " + data.lastUpdate;
        })
        .catch(error => console.error('Eroare la încărcarea fișierului JSON:', error));
});