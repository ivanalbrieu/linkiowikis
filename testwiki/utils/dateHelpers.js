// utils/dateHelpers.js
function formatDate(date) {
    const options = {
        hour: 'numeric',
        minute: 'numeric',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    };
    return new Date(date).toLocaleDateString('en-GB', options).replace(',', '');
}

module.exports = { formatDate };
