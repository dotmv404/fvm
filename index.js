const express = require('express');
const path = require('path');
const axios = require('axios');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to search for products from both APIs
app.get('/search', async (req, res) => {
    const searchQuery = req.query.q;
    if (!searchQuery) {
        return res.status(400).send({ error: 'Search query is required' });
    }

    try {
        // Fetch data from all APIs
        const [firstApiData, secondApiData, thirdApiData, fourApiData, fiveApiData] = await Promise.all([
            fetchFirstAPI(searchQuery),
            fetchAndFilterSecondAPI(searchQuery),
            third(searchQuery),
            four(searchQuery),
            five(searchQuery)
        ]);

        // Log the data from the fifth API to debug
        // console.log('Fifth API Data:', JSON.stringify(fiveApiData, null, 2));

        // Render products from all APIs in HTML
        let html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Search Results</title>
            <link rel="stylesheet" href="/styles.css">
        </head>
        <body>
            <header>
                <h1>Product Search</h1>
                <form action="/search" method="get" class="search-form">
                    <input type="text" name="q" placeholder="Search for products" value="${searchQuery}">
                    <button type="submit">Search</button>
                </form>
            </header>
            <main>
                <h2>Search Results for "${searchQuery}"</h2>
        `;

        // Render products from the first API
        if (firstApiData.data && firstApiData.data.length > 0) {
            html += renderProducts('bhmtraders.com', firstApiData.data, product => `
                <img src="${product.image}" alt="${product.description}">
                <div class="product-info">
                    <h3>${product.description}</h3>
                    <p>Brand: ${product.brand}</p>
                    <p>Price: ${product.units.CTN.price}</p>
                    <p>Inventory: ${product.inventory}</p>
                    <p>Status: ${product.status}</p>
                    <p>Available: ${product.available}</p>
                </div>
            `);
        }

        // Render products from the second API
        if (secondApiData.length > 0) {
            html += renderProducts('eurostoremv.com', secondApiData, product => `
                <img src="https://www.eurostoremv.com/storage/images/${product.image}" alt="${product.name}">
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p>Price: ${product.price}</p>
                    <p>Stock: ${product.stock}</p>
                    <p>Status: ${product.status}</p>
                    <p>Category: ${product.category.name}</p>
                </div>
            `);
        }

        // Render products from the third API
        if (thirdApiData.data && thirdApiData.data.length > 0) {
            html += renderProducts('villamart.mv', thirdApiData.data, product => `
                <img src="https://villamart.sgp1.cdn.digitaloceanspaces.com/site/products/${product.bc_item_number}.jpg" alt="${product.bc_item_number}">
                <div class="product-info">
                    <h3>${product.title}</h3>
                    <p>Inventory: ${product.bc_inventory}</p>
                    <p>Unit Price: ${product.bc_unit_price}</p>
                    <p>In Stock: ${product.in_stock}</p>
                </div>
            `);
        }

        // Render products from the fourth API
        if (fourApiData.products && fourApiData.products.length > 0) {
            html += renderProducts('ikzotrading.com', fourApiData.products, product => `
                <img src="https://me.ikzotrading.com/storage/app/public/product/${product.image[0]}" alt="${product.name}">
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p>Price: ${product.price}</p>
                    <p>Unit: ${product.unit}</p>
                    <p>In Stock: ${product.total_stock}</p>
                </div>
            `);
        }

        // Render products from the fifth API
        if (fiveApiData.data && fiveApiData.data.products && fiveApiData.data.products.length > 0) {
            html += renderProducts('gannamart mobile app', fiveApiData.data.products, product => `
                <img src="https://app.gannamart.com/api/attachables/${product.attachable.id}/download" alt="${product.name}">
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p>Price: ${product.display_price}</p>
                    <p>Unit: ${product.uom}</p>
                </div>
            `);
        }

        // End of HTML content
        html += `
            </main>
        </body>
        </html>
        `;

        res.send(html);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send({ error: 'Failed to fetch data from external APIs' });
    }
});

// Function to fetch data from the first API using Axios
async function fetchFirstAPI(searchQuery) {
    const apiUrl = `https://connect.bhmtraders.com/api/shop/male/products?page=1&search=${searchQuery}`;
    const response = await axios.get(apiUrl);
    return response.data;
}

// Function to fetch data from the second API and filter based on search query
async function fetchAndFilterSecondAPI(searchQuery) {
    const apiUrl = 'https://www.eurostoremv.com/api/public/products';
    const response = await axios.get(apiUrl);
    const products = response.data.data;

    // Filter the products based on search query (through name only)
    return products.filter(product => product.name.toLowerCase().includes(searchQuery.toLowerCase()));
}

// Function to fetch data from the third API
async function third(searchQuery) {
    const apiUrl = `https://base.villamart.mv/api/products?q=${searchQuery}&page=1&limit=5`;
    const response = await axios.get(apiUrl);
    return response.data;
}

// Function to fetch data from the fourth API
async function four(searchQuery) {
    const apiUrl = `https://me.ikzotrading.com/api/v1/products/search?limit=10&offset=1&name=${searchQuery}`;
    const response = await axios.get(apiUrl);
    return response.data;
}

// Function to fetch data from the fifth API
async function five(searchQuery) {
    const apiUrl = `https://app.gannamart.com/api/mobile/search?search=${searchQuery}`;
    const response = await axios.get(apiUrl);
    return response.data;
}

// Helper function to render products
function renderProducts(apiUrl, products, renderProduct) {
    let html = `
    <div class="api-section">
        <div class="api-url">
            <p>${apiUrl}</p>
        </div>
        <div class="product-list">
    `;
    products.forEach(product => {
        html += `<div class="product-item">${renderProduct(product)}</div>`;
    });
    html += `</div></div>`;
    return html;
}

// Serve the home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
