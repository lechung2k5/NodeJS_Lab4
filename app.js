require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const { ListTablesCommand, CreateTableCommand } = require("@aws-sdk/client-dynamodb");
const { ListBucketsCommand, CreateBucketCommand } = require('@aws-sdk/client-s3');
const { client, s3Client } = require('./src/configs/awsConfig');

const app = express();

// 1. Cấu hình View engine và Layout (Phải để TRƯỚC Routes)
app.set('view engine', 'ejs');
app.set('views', './src/views');
app.use(expressLayouts);
app.set('layout', 'layouts/main'); // Đường dẫn tương đối từ thư mục views

// 2. Middleware cơ bản
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
    secret: 'iuh_fit_secret_2026',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 3600000 }
}));

// 3. Biến toàn cục cho EJS
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// 4. Khởi tạo tài nguyên AWS [cite: 131-153]
async function initAWS() {
    const tables = [
        { name: "Products", key: "id" },
        { name: "Users", key: "userId" },
        { name: "Categories", key: "categoryId" },
        { name: "ProductLogs", key: "logId" },
        { name: "Orders", key: "orderId" }
    ];
    const BUCKET = (process.env.S3_BUCKET_NAME || "my-product-bucket-ver1").trim();

    try {
        const { TableNames } = await client.send(new ListTablesCommand({}));
        for (const table of tables) {
            if (!TableNames.includes(table.name)) {
                await client.send(new CreateTableCommand({
                    TableName: table.name,
                    AttributeDefinitions: [{ AttributeName: table.key, AttributeType: "S" }],
                    KeySchema: [{ AttributeName: table.key, KeyType: "HASH" }],
                    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
                }));
            }
        }

        const { Buckets } = await s3Client.send(new ListBucketsCommand({}));
        if (!Buckets.some(b => b.Name === BUCKET)) {
            await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET }));
        }
        console.log("✅ AWS Resources Initialized Successfully");
    } catch (err) {
        console.error("❌ AWS Error:", err.message);
    }
}

// 5. Khai báo Routes
app.use('/', require('./src/routes/authRoutes'));
app.use('/products', require('./src/routes/productRoutes'));

// 6. Điều hướng mặc định [cite: 158]
app.get('/', (req, res) => res.redirect('/products'));

// 7. Xử lý lỗi 404 (Nếu không khớp route nào ở trên)
app.use((req, res) => {
    res.status(404).render('login', { error: 'Trang không tồn tại!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
    initAWS();
});