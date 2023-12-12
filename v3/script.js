let products = [];

// Load saved products from local storage
window.addEventListener('load', () => {
    const savedProducts = localStorage.getItem('savedProducts');
    if (savedProducts) {
        products = JSON.parse(savedProducts);
        displayAddedProductsPreview();
    }
});

function handleProductSelection() {
    const productSelection = document.getElementById('productSelection');
    const otherProductContainer = document.getElementById('otherProductContainer');
    const otherProductNameInput = document.getElementById('otherProductName');

    if (productSelection.value === 'other') {
        otherProductContainer.style.display = 'block';
        otherProductNameInput.required = true;
    } else {
        otherProductContainer.style.display = 'none';
        otherProductNameInput.value = '';
        otherProductNameInput.required = false;
    }
}

function addProduct() {
    const productName = getProductName();
    const productSize = document.getElementById('productSize').value;
    const productPrice = parseFloat(document.getElementById('productPrice').value);
    const productQuantity = parseInt(document.getElementById('productQuantity').value);

    if (!productName || productSize === '' || isNaN(productPrice) || isNaN(productQuantity) || productQuantity <= 0) {
        alert('Please enter valid values for all fields.');
        return;
    }

    const totalProductPrice = productPrice * productQuantity;

    const product = {
        productName: productName,
        productSize: productSize + ' Feet',
        productPrice: productPrice,
        productQuantity: productQuantity,
        totalProductPrice: totalProductPrice
    };

    products.push(product);

    displayAddedProductsPreview();
    saveProductsToLocalStorage();

    resetForm();

    
}

function getProductName() {
    const productSelection = document.getElementById('productSelection');
    const otherProductNameInput = document.getElementById('otherProductName');

    if (productSelection.value === 'other') {
        return otherProductNameInput.value.trim();
    } else {
        return productSelection.options[productSelection.selectedIndex].text;
    }
}

function displayAddedProductsPreview() {
    const addedProductsPreview = document.getElementById('addedProductsPreview');
    addedProductsPreview.innerHTML = '';

    if (products.length === 0) {
        return;
    }

    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Product</th>
                <th>Size</th>
                <th>Price (INR)</th>
                <th>Quantity</th>
                <th>Total Price</th>
            </tr>
        </thead>
        <tbody></tbody>
        <tfoot>
            <tr>
                <td colspan="4"><strong>Final Total Price:</strong></td>
                <td>₹<span id="finalTotalPrice">0.00</span></td>
            </tr>
        </tfoot>
    `;

    const tbody = table.querySelector('tbody');
    const tfoot = table.querySelector('tfoot');
    const finalTotalPriceElement = tfoot.querySelector('#finalTotalPrice');

    let finalTotalPrice = 0;

    products.forEach((product, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.productName}</td>
            <td>${product.productSize}</td>
            <td>₹${product.productPrice.toFixed(2)}</td>
            <td>${product.productQuantity}</td>
            <td>₹${product.totalProductPrice.toFixed(2)}</td>
        `;
        tbody.appendChild(row);

        finalTotalPrice += product.totalProductPrice;
    });

    finalTotalPriceElement.textContent = finalTotalPrice.toFixed(2);

    addedProductsPreview.appendChild(table);
}

function resetForm() {
    document.getElementById('productSize').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productQuantity').value = '1';
    document.getElementById('productSelection').value = '';
    document.getElementById('otherProductName').value = '';
    document.getElementById('otherProductContainer').style.display = 'none';
}

function saveProductsToLocalStorage() {
    localStorage.setItem('savedProducts', JSON.stringify(products));
}

function clearLocalStorage() {
    // Clear products from local storage
    localStorage.removeItem('savedProducts');
    
    // Clear products in memory
    products = [];

    // Update the display
    displayAddedProductsPreview();
}

// ... (other code)

function clearLocalStorage() {
    // Ask for confirmation before clearing local storage
    const confirmation = window.confirm('Are you sure you want to clear the saved products?');

    if (confirmation) {
        // Clear products from local storage
        localStorage.removeItem('savedProducts');
        
        // Clear products in memory
        products = [];

        // Update the display
        displayAddedProductsPreview();
    }
}

// ... (other code)


function shareOnWhatsApp() {
    if (products.length === 0) {
        alert('Please add at least one product.');
        return;
    }

    let sharedText = 'Product Details:\n\n';

    products.forEach((product, index) => {
        const totalProductPrice = product.productPrice * product.productQuantity;
        sharedText += `${index + 1}. ${product.productName}\n`;
        sharedText += `   - Size: ${product.productSize}\n`;
        sharedText += `   - Price: ₹${product.productPrice.toFixed(2)}\n`;
        sharedText += `   - Quantity: ${product.productQuantity}\n`;
        sharedText += `   - Total: ₹${totalProductPrice.toFixed(2)}\n\n`;
    });

    sharedText += `Final Total Price: ₹${calculateFinalTotalPrice().toFixed(2)}`;

    // Encode the text for a URL
    const encodedText = encodeURIComponent(sharedText);

    // Create the WhatsApp shareable link
    const whatsappLink = `https://wa.me/?text=${encodedText}`;

    // Open the link in a new tab/window
    window.open(whatsappLink, '_blank');
}

function calculateFinalTotalPrice() {
    let finalTotalPrice = 0;

    products.forEach((product) => {
        finalTotalPrice += product.totalProductPrice;
    });

    return finalTotalPrice;
}

function toggleFormContainer() {
    const formContainer = document.getElementById('formcontainer');

    // Toggle visibility and update the icon
    if (formContainer.style.display === 'none' || formContainer.style.display === '') {
        formContainer.style.display = 'block';
        setVisibilityIcon('visibility_off');
    } else {
        formContainer.style.display = 'none';
        setVisibilityIcon('visibility');
    }
}

function setVisibilityIcon(iconName) {
    const visibilityIcons = document.querySelectorAll('.hide');

    visibilityIcons.forEach(icon => {
        icon.textContent = iconName;
    });
}
