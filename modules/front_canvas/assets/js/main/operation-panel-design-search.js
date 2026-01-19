document.addEventListener('DOMContentLoaded', () => {
    let designCategoriesList = null;

    function initializeListJS() {
        if (typeof List !== 'undefined') {
            const options = {
                valueNames: ['name'],
                searchClass: 'search',
            };

            designCategoriesList = new List('design-categories-list', options);
            setupSearchFunctionality();
        } else {
            setTimeout(initializeListJS, 100);
        }
    }

    initializeListJS();

    function setupSearchFunctionality() {
        const filterToggleBtn = document.getElementById('filter-toggle-btn');
        const advancedSearchRow = document.getElementById('advanced-search-row');
        const quickSearchInput = document.getElementById('quick-search-input');
        const advancedSearchInput = document.getElementById('advanced-search-input');
        const filterOperator = document.getElementById('filter-operator');

        if (
            !filterToggleBtn ||
            !advancedSearchRow ||
            !quickSearchInput ||
            !advancedSearchInput ||
            !filterOperator
        ) {
            return;
        }

        filterToggleBtn.addEventListener('click', () => {
            const isVisible = advancedSearchRow.style.display !== 'none';
            advancedSearchRow.style.display = isVisible ? 'none' : 'block';

            if (isVisible) {
                advancedSearchInput.value = '';
                applyAdvancedFilter();
            }
        });

        quickSearchInput.addEventListener('input', (e) => {
            if (!designCategoriesList) {
                return;
            }

            const searchTerm = e.target.value.toLowerCase().trim();

            if (searchTerm === '') {
                designCategoriesList.filter();
                return;
            }

            designCategoriesList.filter((item) => {
                const nameElement = item.elm.querySelector('.name');
                const categoryName = nameElement ? nameElement.textContent.toLowerCase().trim() : '';
                return categoryName.includes(searchTerm);
            });
        });

        function applyAdvancedFilter() {
            if (!designCategoriesList) {
                return;
            }

            const searchTerm = advancedSearchInput.value.toLowerCase();
            const operator = filterOperator.value;

            if (searchTerm === '') {
                designCategoriesList.filter();
                return;
            }

            designCategoriesList.filter((item) => {
                const nameElement = item.elm.querySelector('.name');
                const categoryName = nameElement ? nameElement.textContent.toLowerCase().trim() : '';

                switch (operator) {
                    case 'is':
                        return categoryName === searchTerm;
                    case 'isnot':
                        return categoryName !== searchTerm;
                    case 'contains':
                        return categoryName.includes(searchTerm);
                    case 'notcontains':
                        return !categoryName.includes(searchTerm);
                    default:
                        return true;
                }
            });
        }

        advancedSearchInput.addEventListener('input', applyAdvancedFilter);
        filterOperator.addEventListener('change', applyAdvancedFilter);
    }

    const categoryItems = document.querySelectorAll('.category-item');
    const contentSheji = document.querySelector('.content-sheji');

    if (categoryItems.length && contentSheji) {
        categoryItems.forEach((item) => {
            item.addEventListener('click', () => {
                categoryItems.forEach((i) => i.classList.remove('active'));
                item.classList.add('active');
                contentSheji.classList.add('active');
            });
        });
    }

    const backButtons = document.querySelectorAll('.back-button');
    backButtons.forEach((button) => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const categoryItem = button.closest('.category-item');
            if (categoryItem && contentSheji) {
                categoryItem.classList.remove('active');
                contentSheji.classList.remove('active');
            }
        });
    });
});