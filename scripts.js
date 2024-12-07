document.addEventListener('DOMContentLoaded', async function() {
    console.log('Script loaded'); // Confirmăm că scriptul a fost încărcat

    try {
        const response = await fetch('config.json');
        if (!response.ok) {
            throw new Error('Eroare la încărcarea fișierului JSON');
        }
        const data = await response.json();
        console.log('JSON data:', data);

        const content = document.getElementById('content');
        const instrumente = ['Mandolina', 'Vioara 1', 'Vioara 2', 'Chitara'];

        // Adăugăm secțiuni pentru fiecare cântare
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

            // Adăugăm linkuri pentru fiecare instrument
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

            // Funcționalitatea de combinare PDF
            mergeLink.addEventListener('click', async function(e) {
                e.preventDefault();

                const mergedPdf = await PDFLib.PDFDocument.create();
                mergedPdf.setTitle(cantare);

                // Creăm un array de Promises pentru fiecare instrument
                const pdfPromises = instrumente.map(instrument => {
                    const folder = instrument.toLowerCase().replace(' ', '');
                    const pdfUrl = `resources/${folder}/${cantare}.pdf`;

                    return fetch(pdfUrl)
                        .then(response => {
                            if (!response.ok) {
                                console.warn(`Fișierul nu a fost găsit la: ${pdfUrl}`);
                                return null;
                            }
                            return response.arrayBuffer();
                        })
                        .then(pdfBytes => {
                            if (pdfBytes) {
                                return PDFLib.PDFDocument.load(pdfBytes);
                            }
                        })
                        .then(pdfDoc => {
                            if (pdfDoc) {
                                return mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
                            }
                        })
                        .then(copiedPages => {
                            if (copiedPages) {
                                copiedPages.forEach(page => mergedPdf.addPage(page));
                            }
                        })
                        .catch(error => console.error(`Eroare la procesarea fișierului PDF: ${error}`));
                });

                // Așteptăm toate Promises
                await Promise.all(pdfPromises);

                // Salvăm și deschidem PDF-ul combinat
                const mergedPdfBytes = await mergedPdf.save();
                const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
                const blobUrl = URL.createObjectURL(blob);
                window.open(blobUrl);  // Deschide PDF-ul combinat într-o fereastră nouă
            });

            // Toggle pentru a afișa/ascunde lista de instrumente
            title.addEventListener('click', function() {
                list.style.display = list.style.display === 'flex' ? 'none' : 'flex';
            });
        });

        // Actualizare text pentru data ultimei modificări
        const contentLastUpdate = document.getElementById('last-update');
        contentLastUpdate.textContent = "Updated " + data.lastUpdate;
    } catch (error) {
        console.error('Eroare la procesarea fișierului JSON:', error);
    }
});

// Funcția pentru a căuta cântările
function filtrareCantari() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const categories = document.querySelectorAll('.category');

    categories.forEach(category => {
        const title = category.querySelector('.category-title').textContent.toLowerCase();

        if (title.includes(searchTerm)) {
            category.style.display = 'block';
        } else {
            category.style.display = 'none';
        }
    });
}

// Funcția pentru generarea dosarului complet pentru o listă de instrumente
async function generareDosarComplet(instrumente) {
    const mergedPdf = await PDFLib.PDFDocument.create();
    mergedPdf.setTitle(`Dosar complet - Orchestra Bisericii Penticostale Plopeni`);

    try {
        const response = await fetch('config.json');
        if (!response.ok) {
            throw new Error('Eroare la încărcarea fișierului JSON');
        }

        const data = await response.json();

        // Generăm promisiuni pentru fiecare cântare
        const pdfPromises = data.cantari.map(cantare => {
            // Pentru fiecare instrument din lista primită ca parametru
            return instrumente.map(instrument => {
                const folder = instrument.toLowerCase().replace(' ', '');
                const pdfUrl = `resources/${folder}/${cantare}.pdf`;

                return fetch(pdfUrl)
                    .then(response => {
                        if (!response.ok) {
                            console.warn(`Fișierul nu a fost găsit la: ${pdfUrl}`);
                            return null;
                        }
                        return response.arrayBuffer();
                    })
                    .then(pdfBytes => {
                        if (pdfBytes) {
                            return PDFLib.PDFDocument.load(pdfBytes);
                        }
                    })
                    .then(pdfDoc => {
                        if (pdfDoc) {
                            return mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
                        }
                    })
                    .then(copiedPages => {
                        if (copiedPages) {
                            copiedPages.forEach(page => mergedPdf.addPage(page));
                        }
                    })
                    .catch(error => console.error(`Eroare la procesarea fișierului PDF: ${error}`));
            });
        });

        // Așteptăm toate promisiunile
        await Promise.all(pdfPromises.flat());

        // Salvăm și deschidem PDF-ul generat
        const mergedPdfBytes = await mergedPdf.save();
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl);
    } catch (error) {
        console.error('Eroare la încărcarea fișierului JSON:', error);
    }
}
