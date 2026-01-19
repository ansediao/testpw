document.addEventListener('DOMContentLoaded', () => {
    const showReviewsLink = document.getElementById('show-reviews-link');
    const showCuzInfoLink = document.getElementById('show-cuzInfo-link');
    const reviewsModal = document.getElementById('reviews-modal');
    const closeReviewsModal = document.getElementById('close-reviews-modal');
    const reviewTabs = document.querySelectorAll('#review-tabs .review-tab');
    const reviewTabPanes = document.querySelectorAll('#review-tab-content .review-tab-pane');

    function switchReviewTabByIndex(tabIndex) {
        if (!reviewTabs.length || !reviewTabPanes.length) return;

        reviewTabs.forEach((t) => {
            t.classList.remove('active');
            t.style.background = '';
        });
        reviewTabPanes.forEach((pane) => {
            pane.style.display = 'none';
            pane.classList.remove('active');
        });

        if (reviewTabs[tabIndex] && reviewTabPanes[tabIndex]) {
            reviewTabs[tabIndex].classList.add('active');
            reviewTabs[tabIndex].style.background = '#fff';
            reviewTabPanes[tabIndex].style.display = '';
            reviewTabPanes[tabIndex].classList.add('active');
        }

        if (reviewsModal) {
            reviewsModal.style.display = 'flex';
        }
    }

    function switchReviewTabByKey(tabKey) {
        if (!reviewTabs.length || !reviewTabPanes.length) return;

        reviewTabs.forEach((tab) => {
            tab.classList.remove('active');
            tab.style.background = '';
        });

        reviewTabPanes.forEach((pane) => {
            pane.style.display = 'none';
            pane.classList.remove('active');
        });

        reviewTabs.forEach((tab) => {
            const key = tab.getAttribute('data-tab');
            if (key === tabKey) {
                tab.classList.add('active');
                tab.style.background = '#fff';
            }
        });

        reviewTabPanes.forEach((pane) => {
            const key = pane.getAttribute('data-content');
            if (key === tabKey) {
                pane.style.display = '';
                pane.classList.add('active');
            }
        });

        if (reviewsModal) {
            reviewsModal.style.display = 'flex';
        }
    }

    if (showReviewsLink) {
        showReviewsLink.addEventListener('click', (e) => {
            e.preventDefault();
            switchReviewTabByIndex(1);
        });
    }

    if (showCuzInfoLink) {
        showCuzInfoLink.addEventListener('click', (e) => {
            e.preventDefault();
            switchReviewTabByIndex(2);
        });
    }

    reviewTabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            const tabKey = tab.getAttribute('data-tab');
            switchReviewTabByKey(tabKey);
        });
    });

    if (closeReviewsModal && reviewsModal) {
        closeReviewsModal.addEventListener('click', () => {
            reviewsModal.style.display = 'none';
        });

        reviewsModal.addEventListener('click', (e) => {
            if (e.target === reviewsModal) {
                reviewsModal.style.display = 'none';
            }
        });
    }
});