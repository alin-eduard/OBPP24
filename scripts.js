document.addEventListener('DOMContentLoaded', function () {
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

                title.addEventListener('click', function () {
                    list.style.display = list.style.display === 'flex' ? 'none' : 'flex';
                });
            });
        })
        .catch(error => console.error('Eroare la încărcarea fișierului JSON:', error));
});
