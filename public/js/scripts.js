// Lightweight Vanilla UI Components (Replaces Bootstrap JS bundle)
window.bootstrap = {
  Modal: function(element) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    return {
      show: () => el && el.classList.add('show'),
      hide: () => el && el.classList.remove('show'),
      toggle: () => el && el.classList.toggle('show')
    };
  }
};

document.addEventListener('click', function(e) {
  // Modal open trigger
  const modalToggle = e.target.closest('[data-bs-toggle="modal"], [data-toggle="modal"]');
  if (modalToggle) {
    e.preventDefault();
    const targetSelector = modalToggle.getAttribute('data-bs-target') || modalToggle.getAttribute('data-target') || modalToggle.getAttribute('href');
    if (targetSelector) {
      const modal = document.querySelector(targetSelector);
      if (modal) modal.classList.add('show');
    }
    return;
  }

  // Modal close trigger
  const modalDismiss = e.target.closest('[data-bs-dismiss="modal"], [data-dismiss="modal"]');
  if (modalDismiss) {
    e.preventDefault();
    const modal = modalDismiss.closest('.modal');
    if (modal) modal.classList.remove('show');
    return;
  }

  // Click on modal backdrop outside modal-dialog
  if (e.target.classList.contains('modal')) {
    e.target.classList.remove('show');
    return;
  }

  // Dropdown toggle trigger
  const dropdownToggle = e.target.closest('[data-bs-toggle="dropdown"], [data-toggle="dropdown"], .dropdown-toggle');
  if (dropdownToggle) {
    e.preventDefault();
    const parentDropdown = dropdownToggle.closest('.dropdown, .nav-item.dropdown');
    if (parentDropdown) {
      const menu = parentDropdown.querySelector('.dropdown-menu');
      if (menu) {
        const isOpen = menu.classList.contains('show');
        document.querySelectorAll('.dropdown-menu.show').forEach(m => m.classList.remove('show'));
        if (!isOpen) {
          menu.classList.add('show');
        }
      }
    }
    return;
  }

  // If clicked outside any dropdown, close all dropdowns
  if (!e.target.closest('.dropdown, .nav-item.dropdown')) {
    document.querySelectorAll('.dropdown-menu.show').forEach(m => m.classList.remove('show'));
  }

  // Navbar collapse toggle trigger
  const navbarToggler = e.target.closest('[data-bs-toggle="collapse"], .navbar-toggler');
  if (navbarToggler) {
    e.preventDefault();
    const targetSelector = navbarToggler.getAttribute('data-bs-target') || '#navbarToggle';
    const collapseEl = document.querySelector(targetSelector);
    if (collapseEl) {
      collapseEl.classList.toggle('show');
    }
    return;
  }

  // Alert dismiss trigger
  const alertDismiss = e.target.closest('[data-bs-dismiss="alert"]');
  if (alertDismiss) {
    e.preventDefault();
    const alertBox = alertDismiss.closest('.alert');
    if (alertBox) {
      alertBox.remove();
    }
    return;
  }
});

// Close modal & dropdown on Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal.show').forEach(m => m.classList.remove('show'));
    document.querySelectorAll('.dropdown-menu.show').forEach(m => m.classList.remove('show'));
  }
});

var myModal = new window.bootstrap.Modal(document.getElementById('addNewPageModal'));

let preparedCategories = []; // Global array to hold prepared categories for saving

// Assuming you have a function to fetch category suggestions
function fetchCategorySuggestions(input) {
    // Implement fetching logic here
    // Update 'categorySuggestions' container with results
}

function updateCategoryDisplay(newCategories) {
    const categoryLinksContainer = document.querySelector('.category-links');
    if (!categoryLinksContainer) return; // Exit if the container doesn't exist

    // If there are already categories displayed, add a divider
    const existingCategories = categoryLinksContainer.querySelectorAll('.category-link');
    if (existingCategories.length > 0) {
        const divider = document.createElement('span');
        categoryLinksContainer.appendChild(divider);
    }

    newCategories.forEach((categoryName, index) => {
        // Create and append new category link elements here
        const categoryLink = document.createElement('a');
        categoryLink.href = `/wiki/category/${categoryName.replace(/\s+/g, '_')}`; // Replace spaces with underscores for URL
        categoryLink.className = 'category-link';
        categoryLink.title = `Category: ${categoryName.replace(/_/g, ' ')}`; // Display with spaces
        categoryLink.textContent = categoryName.replace(/_/g, ' '); // Display with spaces
        categoryLinksContainer.appendChild(categoryLink);

        // If it's not the last new category, add a divider
        if (index < newCategories.length - 1) {
            const divider = document.createElement('span');

            categoryLinksContainer.appendChild(divider);
        }
    });
}

function createAndHandleCategoryButtons() {
    const categoryInputContainer = document.getElementById('categoryInputContainer');
    const newCategoryNameInput = document.getElementById('newCategoryName');
    const categoryListContainer = document.getElementById('categoryTagsContainer');
    const addCategoryBtn = document.getElementById('CategorySelectAdd');

    // Retrieve the page title from the <h2> tag
    const pageTitleElement = document.getElementById('pageTitle');
    const pageTitle = pageTitleElement ? pageTitleElement.textContent.trim() : '';

// Function to display a prepared category
function displayPreparedCategory(categoryName) {
    const categoryListContainer = document.getElementById('categoryTagsContainer');
    categoryListContainer.style.display = 'flex';
    categoryListContainer.style.flexWrap = 'wrap';
    categoryListContainer.style.gap = '0.5rem';

    // Create a div to hold the category name and remove button
    const categoryTag = document.createElement('div');
    categoryTag.className = 'category-tag-prepared d-flex align-items-center justify-content-between bg-light rounded border';
    categoryTag.style.padding = '0rem 0.5rem';
    categoryListContainer.appendChild(categoryTag);

    // Span to hold the category name displayed with spaces
    const categoryNameSpan = document.createElement('span');
    categoryNameSpan.textContent = categoryName.replace(/_/g, ' ');
    categoryTag.appendChild(categoryNameSpan);

    // FontAwesome icon button for removing the category
    const removeButton = document.createElement('button');
    removeButton.className = 'btn btn-transparent btn-sm';
    removeButton.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    removeButton.addEventListener('click', function() {
        // Here we use the text content which contains spaces to find the index
        const categoryNameWithSpaces = categoryNameSpan.textContent;
        // Convert back to internal representation when searching for index
        const index = preparedCategories.indexOf(categoryNameWithSpaces.replace(/\s+/g, '_'));
        if (index > -1) {
            preparedCategories.splice(index, 1);
            categoryTag.remove();
            if (preparedCategories.length === 0) {
                categoryListContainer.style.display = 'none';
            }
        }
    });
    categoryTag.appendChild(removeButton);
}

// Event listener for Enter keypress to prepare category for saving
newCategoryNameInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault(); // Prevent form submission

        // Capitalize the first letter and trim the category name
        let categoryName = this.value.trim();
        categoryName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);

        // Internal representation with underscores (for array management and backend processing)
        const categoryNameForArray = categoryName.replace(/\s+/g, '_');

        if (categoryName && !preparedCategories.includes(categoryNameForArray)) {
            preparedCategories.push(categoryNameForArray);
            // Display category as entered (with spaces and first letter capitalized) in the UI
            displayPreparedCategory(categoryName);
            this.value = ''; // Clear input field after adding the category
        }
    }
});

// Save and Cancel buttons are created only once
let saveButton = document.getElementById('saveCategoryButton');
let cancelButton = document.getElementById('cancelCategoryButton');

if (!saveButton) {
    saveButton = document.createElement('button');
    saveButton.id = 'saveCategoryButton';
    saveButton.textContent = 'Save';
    saveButton.className = 'btn btn-secondary btn-flat btn-sm ml-2';
    saveButton.style.color = 'white';
    categoryInputContainer.appendChild(saveButton);

    saveButton.addEventListener('click', async function() {
        const urlPathSegments = window.location.pathname.split('/').filter(segment => segment.trim() !== '');
        // Assuming the title is the last segment of the URL
        const pageTitle = urlPathSegments[urlPathSegments.length - 1];
        if (!pageTitle) {
            console.error('Page title not found in URL');
            return;
        }
        const encodedTitle = encodeURIComponent(pageTitle);
    
        // Convert spaces to underscores for backend processing
        const categoriesForBackend = preparedCategories.map(category => category.replace(/\s+/g, '_'));
    
        if (pageTitle && categoriesForBackend.length > 0) {
            try {
                // Use encodeURIComponent to ensure the title is correctly encoded for the URL
                const response = await fetch(`/wiki/${encodedTitle}/addCategories`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ categories: categoriesForBackend })
                });
    
                if (response.ok) {
                    console.log('Categories added successfully');
                    updateCategoryDisplay(preparedCategories); // Update the category display before clearing
    
                    // Clear the input category tags and prepared categories array
                    preparedCategories = [];
                    document.getElementById('newCategoryName').value = ''; // Clear the input field
                    document.getElementById('categoryTagsContainer').style.display = 'none';
                    document.getElementById('categoryTagsContainer').innerHTML = ''; // Clear the tags container
                    document.getElementById('categoryInputContainer').style.display = 'none'; // Hide the input container
                    document.getElementById('CategorySelectAdd').style.display = 'inline-block'; // Show the "Add Category" button again
                } else {
                    const error = await response.json();
                    console.error('Failed to add categories:', await response.text());
                    alert('Failed to add categories: ' + error.message);
                }
            } catch (error) {
                console.error('Error adding categories:', error);
            }
        } else {
            console.log('No categories to save or Page Title is missing');
        }
    });
    
}

if (!cancelButton) {
    cancelButton = document.createElement('button');
    cancelButton.id = 'cancelCategoryButton';
    cancelButton.textContent = 'Cancel';
    cancelButton.className = 'btn btn-primary btn-flat btn-sm ml-2';
    categoryInputContainer.appendChild(cancelButton);

    cancelButton.addEventListener('click', function() {
        // Clear input, prepared categories list, and reset UI
        preparedCategories = []; // Reset the prepared categories array
        document.getElementById('newCategoryName').value = ''; // Clear the input field
        document.getElementById('categoryTagsContainer').style.display = 'none'; // Hide the category tags container
        document.getElementById('categoryTagsContainer').innerHTML = ''; // Clear the tags container
        document.getElementById('categoryInputContainer').style.display = 'none'; // Hide the input container
        document.getElementById('CategorySelectAdd').style.display = 'inline-block'; // Show the "Add Category" button again
    });
}
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize any modals if you're using Bootstrap or similar
    
    // Continue button for adding a new page
    var continueBtn = document.getElementById('continueBtn');
    if (continueBtn) {
        continueBtn.addEventListener('click', async function(event) {
            event.preventDefault(); // Prevent form from submitting immediately
            var pageName = document.getElementById('pageName').value.trim();

            // Check if the first character is a lowercase letter
            if (pageName.charAt(0).match(/^[a-z]/)) {
                event.preventDefault(); // Stop form from submitting
                alert('The page title must not start with a lowercase letter.'); // Show alert to the user
                return false; // Prevent further action
            } else {
            // Check if a page with the entered title already exists
                try {
                    const response = await fetch(`/wiki/checkTitleExists/${encodeURIComponent(pageName)}`);
                    if (response.ok) {
                        const data = await response.json();
                        if (data.exists) {
                            alert('A page with that title already exists.');
                            return false; // Prevent further action
                        } else {
                            // Proceed to edit page if the title does not exist
                            window.location.href = `/wiki/${encodeURIComponent(pageName)}/edit`;
                        }
                    } else {
                        // Handle HTTP error responses
                        console.error('Failed to check title existence:', response.statusText);
                        alert('Error checking if the title exists. Please try again.');
                    }
                } catch (error) {
                    console.error('Error checking if the title exists:', error);
                    alert('Error checking if the title exists. Please try again.');
                }
            }
        });
    }

    // Revision comparison form submission handling
    const revisionComparisonForm = document.getElementById('revisionComparisonForm');
    if (revisionComparisonForm) {
        revisionComparisonForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Prevent the default form submission

            const oldRevisionSelected = document.querySelector('input[name="oldid"]:checked');
            const newRevisionSelected = document.querySelector('input[name="newid"]:checked');
            const alertContainer = document.getElementById('revisionComparisonAlertContainer');

            // Clear any existing alerts
            alertContainer.innerHTML = '';

            // Helper function to display a Bootstrap alert
            function displayBootstrapAlert(message, type = 'warning') {
                const alertHTML = `
                    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                        ${message}
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>
                `;
                alertContainer.innerHTML = alertHTML;
            }

            if (!oldRevisionSelected || !newRevisionSelected) {
                displayBootstrapAlert('Please select both an old and a new revision for comparison.');
                return false;
            }

            const oldRevisionId = parseInt(oldRevisionSelected.value, 10);
            const newRevisionId = parseInt(newRevisionSelected.value, 10);

            if (oldRevisionId >= newRevisionId) {
                displayBootstrapAlert('Please select an old revision that is chronologically before the new revision.');
                return false;
            }

            // Construct the URL with parameters in the correct order
            const formAction = revisionComparisonForm.getAttribute('action');
            const targetUrl = `${formAction}?oldid=${oldRevisionId}&newid=${newRevisionId}`;
            window.location.href = targetUrl; // Redirect to the constructed URL
        });
    }
    
    // Initialize category addition functionality
    createAndHandleCategoryButtons();
    const addCategoryBtn = document.getElementById('CategorySelectAdd');
    const categoryInputContainer = document.getElementById('categoryInputContainer');
    const newCategoryNameInput = document.getElementById('newCategoryName');

    // Show category input container when "Add Category" button is clicked
    if(addCategoryBtn) {
        addCategoryBtn.addEventListener('click', function() {
            categoryInputContainer.style.display = 'flex';
            addCategoryBtn.style.display = 'none';
            newCategoryNameInput.focus();
        });
    }
});