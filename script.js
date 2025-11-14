$(document).ready(function() {
 
    function loadVimeoAPI() {
        return new Promise((resolve) => {
            if (window.Vimeo && window.Vimeo.Player) {
                resolve();
                return;
            }
            // если уже добавлен <script> — проверяем позже
            const existing = document.querySelector('script[src="https://player.vimeo.com/api/player.js"]');
            if (existing) {
                existing.addEventListener('load', () => resolve());
                existing.addEventListener('error', () => resolve()); // даже при ошибке — продолжаем (fallback)
                return;
            }
            const s = document.createElement('script');
            s.src = "https://player.vimeo.com/api/player.js";
            s.async = true;
            s.onload = () => resolve();
            s.onerror = () => resolve();
            document.head.appendChild(s);
        });
    }
        // Vimeo player управление + переход при клике/таче
    const videoIframe = document.getElementById('intro-video');
    let player = null;
    try {
    player = new Vimeo.Player(videoIframe);
    } catch (e) {
    console.warn('Vimeo init error:', e);
    }
    $('.video-overlay.click-catcher').on('click touchstart', function(e) {
    e.preventDefault();
    e.stopPropagation();
    if (player) {
        player.pause().catch(()=>{});
    }
    $('#video-section').fadeOut(800, function() {
        $(this).removeClass('active');
        $('#name-section').addClass('active').fadeIn(800);
    });
    });
    (async function() {
        const $videoSection = $('#video-section');
        const $quoteSection = $('#quote-section');
        const $nameSection = $('#name-section');
        const watchBtn = $('#watch-btn');
        const videoIframe = document.getElementById('intro-video'); // vimeo iframe
        let player = null;
        // Подгружаем Vimeo API 
        await loadVimeoAPI();
        try {
            if (videoIframe && window.Vimeo && window.Vimeo.Player) {
                player = new Vimeo.Player(videoIframe);
            }
        } catch (err) {
            console.warn('Vimeo player init failed:', err);
            player = null;
        }
        // Состояния
        let videoPlayed = false;
        let videoFinished = false;
        watchBtn.off('click').on('click', function(e) {
            e.stopPropagation(); // чтобы глобальные обработчики кликов не сработали
            $quoteSection.fadeOut(800, function() {
                $(this).removeClass('active');
                $videoSection.addClass('active').fadeIn(800, function() {
                    //После появления запускаем видео
                    if (player && typeof player.play === 'function') {
                        try { player.play().catch(()=>{}); } catch(e){/*ignore*/ }
                        videoPlayed = true;
                    } else {
                        //Если нет vimeo player - пробуем извлечь обычный HTMLVideoElement внутри
                        const htmlVid = $('#video-section').find('video')[0];
                        if (htmlVid) {
                            try { htmlVid.play(); } catch(e) {}
                            videoPlayed = true;
                        }
                    }
                });
                
                if (player && typeof player.on === 'function') {
                    player.off('ended'); // сбросим старые, если есть
                    player.on('ended', function() {
                        videoFinished = true;
                        $videoSection.fadeOut(800, function() {
                            $videoSection.removeClass('active');
                            $nameSection.addClass('active').fadeIn(800);
                        });
                    });
                } else {
                    // Если HTML5 видео (fallback) 
                    const htmlVid = $('#video-section').find('video')[0];
                    if (htmlVid) {
                        $(htmlVid).off('ended').on('ended', function() {
                            videoFinished = true;
                            $videoSection.fadeOut(800, function() {
                                $videoSection.removeClass('active');
                                $nameSection.addClass('active').fadeIn(800);
                            });
                        });
                    }
                }
            });
        });
        
        const onScrollCheck = throttle(function () {
            if (videoPlayed || videoFinished) return;
            if ($videoSection.length === 0) return;
            const rect = $videoSection[0].getBoundingClientRect();
            const inView = rect.top < window.innerHeight && rect.bottom > 0;
            if (inView) {
                $videoSection.fadeIn(800).addClass('active');
                if (player && typeof player.play === 'function') {
                    try { player.play().catch(()=>{}); } catch(e){/*ignore*/ }
                    videoPlayed = true;
                } else {
                    const htmlVid = $('#video-section').find('video')[0];
                    if (htmlVid) {
                        try { htmlVid.play(); } catch(e) {}
                        videoPlayed = true;
                    }
                }
            }
        }, 150);
        $(window).on('scroll', onScrollCheck);
        //Проверяем на загрузке страницы 
        onScrollCheck();
        //игнорируем клики по интерактивным элементам 
        $(document).off('click.videoSkip').on('click.videoSkip', function(e) {
            if (!videoPlayed || videoFinished) return;
            const ignored = e.target.closest('button, a, input, textarea, select, label, .no-skip, #watch-btn');
            if (ignored) return;
            if (e.target.closest && e.target.closest('.dont-skip')) return;
            
            try {
                if (player && typeof player.pause === 'function') {
                    player.pause().catch(()=>{});
                } else {
                    const htmlVid = $('#video-section').find('video')[0];
                    if (htmlVid) try { htmlVid.pause(); } catch(e){}
                }
            } catch(err) {
                console.warn('Pause failed', err);
            }
            videoFinished = true;
            $videoSection.fadeOut(800, function() {
                $videoSection.removeClass('active');
                $nameSection.fadeIn(800).addClass('active');
            });
        });
        $('.click-skip, .video-overlay').off('click.videoOverlay').on('click.videoOverlay', function(e) {
            e.stopPropagation();
            if (!videoPlayed || videoFinished) return;
            //запустим тот же переход:
            try {
                if (player && typeof player.pause === 'function') player.pause().catch(()=>{});
            } catch(_) {}
            videoFinished = true;
            $videoSection.fadeOut(800, function() {
                $videoSection.removeClass('active');
                $nameSection.fadeIn(800).addClass('active');
            });
        });
    })();
   
   
    /* FILMOGRAPHY PAGE - HORIZONTAL SCROLL & MODAL */
   
    if ($('.filmography-page').length > 0) {
        const filmRow = $('.film-row');
        filmRow.html(filmRow.html() + filmRow.html());
       
        const modal = new bootstrap.Modal($('#videoModal'));
       
        $('.play-btn').on('click', function() {
            const item = $(this).closest('.film-poster-item');
            const videoSrc = item.data('video');
            const title = item.find('h3').text().trim();
           
            $('#videoTitle').text(title);

            const player = $('#modalPlayer');
            player.empty();

            if (videoSrc.includes('youtu')) {
                let videoId = videoSrc.split('/').pop().split('?')[0];
                if (videoSrc.includes('watch?v=')) {
                    videoId = new URLSearchParams(new URL(videoSrc).search).get('v');
                }
                player.html(`<iframe class="w-100 h-100" src="https://www.youtube.com/embed/${videoId}?autoplay=1" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`);
            } else {
                player.html(`<video class="w-100 h-100" controls playsinline><source src="${videoSrc}" type="video/mp4">Your browser does not support HTML5 video.</video>`);
            }
           
            modal.show();
           
            $('#videoModal').on('shown.bs.modal', function() {
                if (!videoSrc.includes('youtu')) {
                    player.find('video')[0].play();
                }
            });
        });
       
        $('#videoModal').on('hidden.bs.modal', function() {
            $('#modalPlayer').empty();
        });
    }
   
   
    /* SCROLL-TRIGGERED FADE-IN ANIMATIONS
       Works on all pages */
   
    function checkScroll() {
        $('.fade-in-scroll').each(function() {
            const elementTop = $(this).offset().top;
            const elementBottom = elementTop + $(this).outerHeight();
            const viewportTop = $(window).scrollTop();
            const viewportBottom = viewportTop + $(window).height();
           
            if (elementBottom > viewportTop && elementTop < (viewportBottom - 100)) {
                $(this).addClass('visible');
            }
        });
    }
   
    // Check on load and scroll
    checkScroll();
    $(window).on('scroll', checkScroll);
    $(window).on('resize', checkScroll);
   
   
    /* SMOOTH SCROLL FOR ANCHOR LINKS*/
   
    $('a[href^="#"]').on('click', function(e) {
        const target = $(this.getAttribute('href'));
       
        if (target.length) {
            e.preventDefault();
            $('html, body').stop().animate({
                scrollTop: target.offset().top - 100
            }, 1000, 'swing');
        }
    });
   
   
    /* CONTACT FORM VALIDATION & SUBMISSION*/
   
    if ($('#contact-form').length > 0) {
        const contactForm = $('#contact-form');
        const successMessage = $('#success-message');
        const errorMessage = $('#error-message');
       
        contactForm.on('submit', function(e) {
            e.preventDefault();
           
            successMessage.hide();
            errorMessage.hide();
           
            const name = $('#name').val().trim();
            const email = $('#email').val().trim();
            const message = $('#message').val().trim();
           
            $('.form-control').removeClass('is-invalid');
           
            let isValid = true;
           
            if (name === '') {
                $('#name').addClass('is-invalid');
                isValid = false;
            }
           
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (email === '' || !emailRegex.test(email)) {
                $('#email').addClass('is-invalid');
                isValid = false;
            }
           
            if (message === '') {
                $('#message').addClass('is-invalid');
                isValid = false;
            }
           
            if (isValid) {
                successMessage.fadeIn(400);
                contactForm[0].reset();
               
                $('html, body').animate({
                    scrollTop: successMessage.offset().top - 100
                }, 600);
               
                setTimeout(function() {
                    successMessage.fadeOut(400);
                }, 5000);
            } else {
                errorMessage.fadeIn(400);
                setTimeout(function() {
                    errorMessage.fadeOut(400);
                }, 5000);
            }
        });
       
        // Real-time validation
        $('#name, #email, #message').on('blur', function() {
            const field = $(this);
            const value = field.val().trim();
           
            if (field.attr('id') === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (value === '' || !emailRegex.test(value)) {
                    field.addClass('is-invalid');
                } else {
                    field.removeClass('is-invalid');
                }
            } else {
                if (value === '') {
                    field.addClass('is-invalid');
                } else {
                    field.removeClass('is-invalid');
                }
            }
        });
       
        $('.form-control').on('focus', function() {
            $(this).removeClass('is-invalid');
        });
    }
   
   
    /* NAVBAR BACKGROUND ON SCROLL*/
   
    $(window).on('scroll', function() {
        if ($(window).scrollTop() > 100) {
            $('.navbar').addClass('scrolled');
        } else {
            $('.navbar').removeClass('scrolled');
        }
    });
   
   
    /* LAZY LOADING ENHANCEMENT*/
   
    if ('loading' in HTMLImageElement.prototype) {
        $('img').each(function() {
            if (!$(this).attr('loading')) {
                $(this).attr('loading', 'lazy');
            }
        });
    }
   
   
    /* TECHNIQUE IMAGE HOVER EFFECT (Style Page)*/
   
    if ($('.style-page').length > 0) {
        $('.technique-image-wrapper').on('mouseenter', function() {
            $(this).find('.technique-image').css({
                'transform': 'scale(1.08)',
                'filter': 'brightness(1.05) contrast(1.15)'
            });
        });
       
        $('.technique-image-wrapper').on('mouseleave', function() {
            $(this).find('.technique-image').css({
                'transform': 'scale(1)',
                'filter': 'brightness(0.9) contrast(1.05)'
            });
        });
    }
   
   
    /*  MOBILE MENU AUTO-CLOSE*/
   
    $('.navbar-nav .nav-link').on('click', function() {
        if ($(window).width() < 992) {
            $('.navbar-collapse').collapse('hide');
        }
    });
   
   
    /*  SMOOTH IMAGE REVEAL ON LOAD*/
   
    $(window).on('load', function() {
        $('.bio-image, .technique-image').each(function() {
            $(this).css('opacity', '0');
            $(this).animate({ opacity: 1 }, 1200);
        });
    });
   
   
    /*KEYBOARD NAVIGATION*/
   
    $(document).on('keydown', function(e) {
        // ESC to close video
        if (e.key === 'Escape' && $('#video-section').hasClass('active')) {
            $('#video-section').fadeOut(800, function() {
                $(this).removeClass('active');
                $('#name-section').addClass('active').fadeIn(800);
            });
        }
    });
   
   
    /* FILM CARD POINTER TRACKING (Optional Enhancement)
       Subtle glow follows cursor on filmography cards*/
   
    if ($('.filmography-page').length > 0) {
        $('.film-poster-item').on('mousemove', function(e) {
            const card = $(this);
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
           
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
           
            const rotateX = (y - centerY) / 30;
            const rotateY = (centerX - x) / 30;
           
            //Subtle 3D tilt effect
            card.css('transform', `
                scale(1.05) translateY(-20px)
                perspective(1000px)
                rotateX(${rotateX}deg)
                rotateY(${rotateY}deg)
            `);
        });
       
        $('.film-poster-item').on('mouseleave', function() {
            $(this).css('transform', '');
        });
    }
   
   
    /*AWARDS PAGE - HIGHLIGHT FROM QUERY PARAM]*/
   
    if ($('.awards-page').length > 0) {
        const urlParams = new URLSearchParams(window.location.search);
        const film = urlParams.get('film');
       
        if (film) {
            const item = $(`.award-item[data-film="${film}"]`);
            if (item.length) {
                item.addClass('highlight visible');
                $('html, body').animate({
                    scrollTop: item.offset().top - 150
                }, 800);
               
                setTimeout(() => {
                    item.removeClass('highlight');
                }, 3000);
            }
        }
    }
   
   
    /* CONSOLE EASTER EGG*/
   
    console.log('%c🎬 WONG KAR-WAI TRIBUTE', 'font-size: 20px; font-weight: bold; color: #d1a054;');
    console.log('%c"If memories could be canned, would they also have expiry dates?"', 'font-size: 14px; font-style: italic; color: #3e8f75;');
    console.log('%cRedesigned 2025 — Cinematic Experience', 'font-size: 12px; color: #a34b4b;');
   
});
/* UTILITY FUNCTIONS*/
//Debounce for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
//Throttle for scroll events
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
/* END OF SCRIPT*/