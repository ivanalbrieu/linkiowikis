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

var modalEl = document.getElementById('addNewPageModal');
var myModal = modalEl ? new window.bootstrap.Modal(modalEl) : null;

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

    if (!categoryInputContainer || !newCategoryNameInput) return;

    // Retrieve the page title from the <h2> tag
    const pageTitleElement = document.getElementById('pageTitle');
    const pageTitle = pageTitleElement ? pageTitleElement.textContent.trim() : '';

    // Function to display a prepared category
    function displayPreparedCategory(categoryName) {
        if (!categoryListContainer) return;
        categoryListContainer.style.display = 'flex';
        categoryListContainer.style.flexWrap = 'wrap';
        categoryListContainer.style.gap = '0.5rem';

        // Create a div to hold the category name and remove button
        const categoryTag = document.createElement('div');
        categoryTag.className = 'category-tag-prepared flex items-center justify-between bg-gray-100 rounded border border-gray-300 px-2 py-0.5 text-xs';
        categoryListContainer.appendChild(categoryTag);

        // Span to hold the category name displayed with spaces
        const categoryNameSpan = document.createElement('span');
        categoryNameSpan.textContent = categoryName.replace(/_/g, ' ');
        categoryTag.appendChild(categoryNameSpan);

        // FontAwesome icon button for removing the category
        const removeButton = document.createElement('button');
        removeButton.className = 'btn btn-transparent btn-sm ml-1 text-gray-500 hover:text-red-600';
        removeButton.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        removeButton.addEventListener('click', function() {
            const categoryNameWithSpaces = categoryNameSpan.textContent;
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
            const pageTitle = urlPathSegments[urlPathSegments.length - 1];
            if (!pageTitle) {
                console.error('Page title not found in URL');
                return;
            }
            const encodedTitle = encodeURIComponent(pageTitle);
            const categoriesForBackend = preparedCategories.map(category => category.replace(/\s+/g, '_'));
        
            if (pageTitle && categoriesForBackend.length > 0) {
                try {
                    const response = await fetch(`/wiki/${encodedTitle}/addCategories`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ categories: categoriesForBackend })
                    });
        
                    if (response.ok) {
                        console.log('Categories added successfully');
                        updateCategoryDisplay(preparedCategories);
        
                        preparedCategories = [];
                        newCategoryNameInput.value = '';
                        if (categoryListContainer) {
                            categoryListContainer.style.display = 'none';
                            categoryListContainer.innerHTML = '';
                        }
                        categoryInputContainer.style.display = 'none';
                        if (addCategoryBtn) addCategoryBtn.style.display = 'inline-block';
                    } else {
                        const error = await response.json();
                        console.error('Failed to add categories:', await response.text());
                        alert('Failed to add categories: ' + error.message);
                    }
                } catch (error) {
                    console.error('Error adding categories:', error);
                }
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
            preparedCategories = [];
            newCategoryNameInput.value = '';
            if (categoryListContainer) {
                categoryListContainer.style.display = 'none';
                categoryListContainer.innerHTML = '';
            }
            categoryInputContainer.style.display = 'none';
            if (addCategoryBtn) addCategoryBtn.style.display = 'inline-block';
        });
    }
}

// ==========================================
// Markdown Editor Toolbar, Shortcuts & Live Preview
// ==========================================
function initEditor() {
    const textInput = document.getElementById('textInput');
    const editorForm = document.getElementById('wikiEditorForm');
    const tabWriteBtn = document.getElementById('tabWriteBtn');
    const tabPreviewBtn = document.getElementById('tabPreviewBtn');
    const editorWriteSection = document.getElementById('editorWriteSection');
    const editorPreviewSection = document.getElementById('editorPreviewSection');
    const editorPreviewOutput = document.getElementById('editorPreviewOutput');

    if (!textInput || !editorForm) return;

    let isFormDirty = false;

    textInput.addEventListener('input', function() {
        isFormDirty = true;
    });

    window.addEventListener('beforeunload', function(e) {
        if (isFormDirty) {
            e.preventDefault();
            e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            return e.returnValue;
        }
    });

    editorForm.addEventListener('submit', function() {
        isFormDirty = false;
    });

    function insertOrWrapText(before, after = '', defaultPlaceholder = '') {
        textInput.focus();
        const start = textInput.selectionStart;
        const end = textInput.selectionEnd;
        const selectedText = textInput.value.substring(start, end) || defaultPlaceholder;
        const replacement = before + selectedText + after;
        textInput.setRangeText(replacement, start, end, 'select');
        textInput.dispatchEvent(new Event('input'));
    }

    // Attach click handlers to all toolbar buttons
    document.querySelectorAll('.btn-toolbar[data-action]').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const action = this.getAttribute('data-action');
            switch (action) {
                case 'h1': insertOrWrapText('# ', '', 'Heading 1'); break;
                case 'h2': insertOrWrapText('## ', '', 'Heading 2'); break;
                case 'h3': insertOrWrapText('### ', '', 'Heading 3'); break;
                case 'bold': insertOrWrapText('**', '**', 'bold text'); break;
                case 'italic': insertOrWrapText('*', '*', 'italic text'); break;
                case 'strike': insertOrWrapText('~~', '~~', 'strikethrough text'); break;
                case 'wikilink': insertOrWrapText('[[', ']]', 'Page Title'); break;
                case 'link': insertOrWrapText('[', '](https://example.com)', 'Link text'); break;
                case 'ul': insertOrWrapText('- ', '', 'List item'); break;
                case 'ol': insertOrWrapText('1. ', '', 'List item'); break;
                case 'quote': insertOrWrapText('> ', '', 'Quote text'); break;
                case 'code': insertOrWrapText('```\n', '\n```', 'console.log("Hello World");'); break;
                case 'table':
                    insertOrWrapText('\n| Column 1 | Column 2 | Column 3 |\n|---|---|---|\n| Item A | Item B | Item C |\n| Item D | Item E | Item F |\n\n');
                    break;
                case 'hr': insertOrWrapText('\n---\n'); break;
            }
        });
    });

    // Template insertions
    document.querySelectorAll('.template-insert').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const template = this.getAttribute('data-template');
            switch (template) {
                case 'article':
                    insertOrWrapText(
                        '## Overview\nBrief description of the subject.\n\n## History\nDetailed background and timeline.\n\n## Key Features\n- Point 1\n- Point 2\n\n## References\n* External reference links or notes.\n'
                    );
                    break;
                case 'infobox':
                    insertOrWrapText(
                        '| Property | Details |\n|---|---|\n| **Name** | Value |\n| **Type** | Value |\n| **Created** | Value |\n| **Status** | Active |\n\n'
                    );
                    break;
                case 'stub':
                    insertOrWrapText('> *This article is a stub. You can help by expanding it.*\n\n');
                    break;
                case 'signature':
                    insertOrWrapText(' ~~~~ ');
                    break;
            }
        });
    });

    // Keyboard shortcuts
    textInput.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
            if (e.key === 'b' || e.key === 'B') {
                e.preventDefault();
                insertOrWrapText('**', '**', 'bold text');
            } else if (e.key === 'i' || e.key === 'I') {
                e.preventDefault();
                insertOrWrapText('*', '*', 'italic text');
            } else if (e.key === 'k' || e.key === 'K') {
                e.preventDefault();
                insertOrWrapText('[[', ']]', 'Page Title');
            } else if (e.key === 's' || e.key === 'S') {
                e.preventDefault();
                editorForm.requestSubmit();
            }
        }
    });

    // Write vs Live Preview Tab Switching
    if (tabWriteBtn && tabPreviewBtn && editorWriteSection && editorPreviewSection) {
        tabWriteBtn.addEventListener('click', function(e) {
            e.preventDefault();
            editorWriteSection.classList.remove('hidden');
            editorPreviewSection.classList.add('hidden');
            tabWriteBtn.className = 'px-3 py-1 text-xs font-semibold rounded bg-white text-gray-800 shadow-sm border border-gray-200 transition-colors cursor-pointer';
            tabPreviewBtn.className = 'px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer';
            textInput.focus();
        });

        tabPreviewBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            editorWriteSection.classList.add('hidden');
            editorPreviewSection.classList.remove('hidden');
            tabPreviewBtn.className = 'px-3 py-1 text-xs font-semibold rounded bg-white text-gray-800 shadow-sm border border-gray-200 transition-colors cursor-pointer';
            tabWriteBtn.className = 'px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer';

            editorPreviewOutput.innerHTML = '<div class="text-gray-400 italic">Rendering preview...</div>';

            try {
                const response = await fetch('/wiki/api/preview', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: textInput.value })
                });
                if (response.ok) {
                    const data = await response.json();
                    editorPreviewOutput.innerHTML = data.html || '<div class="text-gray-400 italic">No content to preview.</div>';
                } else {
                    editorPreviewOutput.innerHTML = '<div class="text-red-600">Failed to generate live preview.</div>';
                }
            } catch (err) {
                console.error('Preview error:', err);
                editorPreviewOutput.innerHTML = '<div class="text-red-600">Error generating live preview.</div>';
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // 1. Initialize Markdown Editor (first so it always runs on edit page)
    initEditor();

    // 2. Initialize category addition functionality if present
    createAndHandleCategoryButtons();
    const addCategoryBtn = document.getElementById('CategorySelectAdd');
    const categoryInputContainer = document.getElementById('categoryInputContainer');
    const newCategoryNameInput = document.getElementById('newCategoryName');

    if(addCategoryBtn && categoryInputContainer && newCategoryNameInput) {
        addCategoryBtn.addEventListener('click', function() {
            categoryInputContainer.style.display = 'flex';
            addCategoryBtn.style.display = 'none';
            newCategoryNameInput.focus();
        });
    }

    // 3. Continue button for adding a new page
    var continueBtn = document.getElementById('continueBtn');
    if (continueBtn) {
        continueBtn.addEventListener('click', async function(event) {
            event.preventDefault();
            var pageName = document.getElementById('pageName').value.trim();

            if (pageName.charAt(0).match(/^[a-z]/)) {
                alert('The page title must not start with a lowercase letter.');
                return false;
            } else {
                try {
                    const response = await fetch(`/wiki/checkTitleExists/${encodeURIComponent(pageName)}`);
                    if (response.ok) {
                        const data = await response.json();
                        if (data.exists) {
                            alert('A page with that title already exists.');
                            return false;
                        } else {
                            window.location.href = `/wiki/${encodeURIComponent(pageName)}/edit`;
                        }
                    } else {
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

    // 4. Revision comparison form submission handling
    const revisionComparisonForm = document.getElementById('revisionComparisonForm');
    if (revisionComparisonForm) {
        revisionComparisonForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const oldRevisionSelected = document.querySelector('input[name="oldid"]:checked');
            const newRevisionSelected = document.querySelector('input[name="newid"]:checked');
            const alertContainer = document.getElementById('revisionComparisonAlertContainer');

            if (alertContainer) alertContainer.innerHTML = '';

            function displayBootstrapAlert(message, type = 'warning') {
                const alertHTML = `
                    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                        ${message}
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>
                `;
                if (alertContainer) alertContainer.innerHTML = alertHTML;
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

            const formAction = revisionComparisonForm.getAttribute('action');
            const targetUrl = `${formAction}?oldid=${oldRevisionId}&newid=${newRevisionId}`;
            window.location.href = targetUrl;
        });
    }
});
