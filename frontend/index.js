/* =========================================================
   OTITISAI-CDSS
   HOME PAGE JAVASCRIPT
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       MOBILE NAVIGATION
       ===================================================== */

    const navbar = document.querySelector(".navbar");
    const navLinks = document.querySelector(".nav-links");

    /*
     * The navigation is intentionally kept simple.
     * The existing links directly open:
     *
     * index.html
     * app.html
     * dashboard.html
     * report.html
     */

    /* =====================================================
       SMOOTH SCROLL
       ===================================================== */

    const scrollLinks = document.querySelectorAll(
        'a[href^="#"]'
    );

    scrollLinks.forEach(link => {

        link.addEventListener("click", function (event) {

            const targetId =
                this.getAttribute("href");

            if (!targetId || targetId === "#") {
                return;
            }

            const target =
                document.querySelector(targetId);

            if (target) {

                event.preventDefault();

                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }

        });

    });


    /* =====================================================
       NAVBAR SCROLL EFFECT
       ===================================================== */

    function handleNavbarScroll() {

        if (!navbar) {
            return;
        }

        if (window.scrollY > 20) {

            navbar.classList.add("navbar-scrolled");

        } else {

            navbar.classList.remove("navbar-scrolled");

        }

    }

    window.addEventListener(
        "scroll",
        handleNavbarScroll
    );

    handleNavbarScroll();


    /* =====================================================
       ACTIVE NAVIGATION
       ===================================================== */

    const currentPage =
        window.location.pathname
            .split("/")
            .pop() || "index.html";

    const navigationLinks =
        document.querySelectorAll(".nav-links a");

    navigationLinks.forEach(link => {

        const linkPage =
            link.getAttribute("href");

        if (linkPage === currentPage) {

            link.classList.add("active");

        } else {

            link.classList.remove("active");

        }

    });


    /* =====================================================
       HERO BUTTON
       ===================================================== */

    const startDiagnosisButton =
        document.querySelector(
            'a[href="app.html"]'
        );

    if (startDiagnosisButton) {

        startDiagnosisButton.addEventListener(
            "click",
            function () {

                console.log(
                    "Opening OtitisAI-CDSS diagnosis page..."
                );

            }
        );

    }


    /* =====================================================
       FEATURE CARD INTERACTION
       ===================================================== */

    const featureCards =
        document.querySelectorAll(".feature-card");

    featureCards.forEach(card => {

        card.addEventListener("mouseenter", function () {

            this.classList.add("feature-hover");

        });

        card.addEventListener("mouseleave", function () {

            this.classList.remove("feature-hover");

        });

    });


    /* =====================================================
       SCROLL REVEAL ANIMATION
       ===================================================== */

    const revealElements =
        document.querySelectorAll(
            ".feature-card, " +
            ".workflow-step, " +
            ".stat-item, " +
            ".support-card"
        );

    if ("IntersectionObserver" in window) {

        const observer =
            new IntersectionObserver(
                function (entries) {

                    entries.forEach(entry => {

                        if (entry.isIntersecting) {

                            entry.target.classList.add(
                                "reveal-visible"
                            );

                            observer.unobserve(
                                entry.target
                            );

                        }

                    });

                },
                {
                    threshold: 0.12
                }
            );

        revealElements.forEach(element => {

            element.classList.add(
                "reveal-element"
            );

            observer.observe(element);

        });

    } else {

        revealElements.forEach(element => {

            element.classList.add(
                "reveal-visible"
            );

        });

    }


    /* =====================================================
       DIAGNOSTIC CARD ANIMATION
       ===================================================== */

    const progressBar =
        document.querySelector(
            ".progress-value"
        );

    if (progressBar) {

        setTimeout(function () {

            progressBar.style.width = "82%";

        }, 400);

    }


    /* =====================================================
       CONSOLE INFORMATION
       ===================================================== */

    console.log(
        "OtitisAI-CDSS Home Page initialized."
    );

});