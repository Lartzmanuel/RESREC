    //validation for the register page
    if (window.location.pathname === '/register') {
        var form = document.getElementById("registerForm");

        form.addEventListener("submit", function(event) {
            event.preventDefault();

            // Clear previous error messages
            document.getElementById("name-error").textContent = "";
            document.getElementById("email-error").textContent = "";
            document.getElementById("password-error").textContent = "";

            var nameInput = document.getElementById("register-name").value;
            var emailInput = document.getElementById("register-email").value;
            var passwordInput = document.getElementById("register-password").value;

            var valid = true;

            // Name validation
            var validNameRegex = /^[a-zA-Z\s'-]+$/;
            if (!validNameRegex.test(nameInput)) {
                document.getElementById("name-error").textContent = "Invalid name. Please use only letters, spaces, hyphens, and apostrophes.";
                valid = false;
            }

            // Email validation
            var validEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!validEmailRegex.test(emailInput)) {
                document.getElementById("email-error").textContent = "Invalid email format.";
                valid = false;
            }

            // Password validation
            if (passwordInput.length < 8) {
                document.getElementById("password-error").textContent = "Password must be at least 8 characters long.";
                valid = false;
            } else {
                var hasUpperCase = /[A-Z]/.test(passwordInput);
                var hasLowerCase = /[a-z]/.test(passwordInput);
                var hasNumbers = /\d/.test(passwordInput);
                var hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(passwordInput);

                if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecial) {
                    document.getElementById("password-error").textContent = "Password must include uppercase, lowercase, number, and special character.";
                    valid = false;
                }
            }

            if (valid) {
                form.submit();
            }
        });
    }


    //overlay of nav for smaller screen size
    const bar = document.querySelector('.bar');
    const close = document.querySelector('.close');
    const overlayNav = document.querySelector('.overlay-nav');

    bar.addEventListener('click', function() {
        overlayNav.style.display = 'flex'; // Show the overlay nav
        bar.style.display = 'none'; // Hide the hamburger icon
        close.style.display = 'block'; // Show the close icon
    });

    close.addEventListener('click', function() {
        overlayNav.style.display = 'none'; // Hide the overlay nav
        close.style.display = 'none'; // Hide the close icon
        bar.style.display = 'block'; // Show the hamburger icon
    });

   // To load resources
    async function loadResources() {
        try {
            const response = await fetch('/udemy');
            const data = await response.json();
            // Handle the data, e.g., display resources
        } catch (error) {
            console.error('Failed to load resources:', error);
        }
    }

    // To handle a resource click
    async function handleResourceClick(event,resource) {
    event.preventDefault()
        try {
            console.log(resource);
            const response = await fetch('/click-resource', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...resource }),
            });
            console.log(response);
            const data = await response.json();
            if (response.ok) {
            window.open(resource.link, '_blank');
            } else {
            console.error('Failed to handle resource click:', data.error);
            }
        } catch (error) {
            console.error('Failed to handle resource click:', error);
        }
    }

    const myModal = document.getElementById('myModal')
    const logoutBtn = document.querySelectorAll('.logout');
    const closebtn = document.getElementById('closebtn')
    const yesBtn = document.getElementById('yesBtn')
    const noBtn = document.getElementById('noBtn')


    logoutBtn.forEach(logout => {
        logout.addEventListener('click', (event)=> {
            // event.preventDefault();
            myModal.style.display = 'block';
        })
    })

    //function that closes the modal
    function closeModal() {
        myModal.style.display = 'none'
    }

    closebtn.addEventListener('click', closeModal)
    noBtn.addEventListener('click', closeModal)

    window.onclick = (event) => {
        if(event.target == myModal){
            closeModal();
        }
    }



    yesBtn.addEventListener('click', async (event) => {
      event.preventDefault();
      
      try {
          const response = await fetch('/logout', {
              method: 'POST',
          });
  
          if (response.ok) {
              window.location.href = '/login';
          } else {
              console.error('Logout failed');
          }
      } catch (error) {
          console.error('Error during logout:', error);
      }
  
      closeModal();
  });

