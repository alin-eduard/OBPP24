document.addEventListener('DOMContentLoaded', function () {
    const correctPassword = '0000';  // Schimbă această parolă cu cea dorită

    var loginButton = document.getElementById('loginButton');
    var passwordInput = document.getElementById('passwordInput');
    var errorMessage = document.getElementById('errorMessage');
    var authContainer = document.getElementById('auth');
    var contentContainer = document.getElementById('content');

    loginButton.addEventListener('click', function () {
        var enteredPassword = passwordInput.value;
        if (enteredPassword === correctPassword) {
            authContainer.style.display = 'none';
            contentContainer.style.display = 'block';
        } else {
            errorMessage.textContent = 'Parola incorectă. Încercați din nou.';
        }
    });
});
