document.addEventListener('DOMContentLoaded', function () {
    var categoryTitles = document.querySelectorAll('.category-title');

    categoryTitles.forEach(function (title) {
        title.addEventListener('click', function () {
            var content = this.nextElementSibling;
            if (content.style.display === 'block') {
                content.style.display = 'none';
                content.style.maxHeight = '0';
                content.style.opacity = '0';
            } else {
                content.style.display = 'block';
                content.style.maxHeight = content.scrollHeight + 'px';
                content.style.opacity = '1';
            }
        });
    });
});
