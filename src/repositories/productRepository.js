const { docClient } = require('../configs/awsConfig');
const { ScanCommand, PutCommand, UpdateCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require('uuid');

const TABLE_NAME = "Products";
const LOG_TABLE_NAME = "ProductLogs";

class ProductRepository {

    // Ghi nhật ký thao tác (CREATE, UPDATE, DELETE) vào bảng ProductLogs
    async _createLog(productId, action, userId = "System") {
        const logParams = {
            TableName: LOG_TABLE_NAME,
            Item: {
                logId: uuidv4(),
                productId: productId,
                action: action,
                userId: userId,
                time: new Date().toISOString()
            }
        };
        try {
            await docClient.send(new PutCommand(logParams));
        } catch (error) {
            console.error("Lỗi ghi log hệ thống:", error);
        }
    }

    // Lấy tất cả sản phẩm có trạng thái chưa bị xóa (isDeleted = false)
    async getAllActive() {
        const params = {
            TableName: TABLE_NAME,
            FilterExpression: "isDeleted = :d",
            ExpressionAttributeValues: { ":d": false }
        };
        const result = await docClient.send(new ScanCommand(params));
        return result.Items || [];
    }

    // Lấy toàn bộ lịch sử thao tác từ bảng nhật ký hệ thống
    async getAllLogs() {
        const params = { TableName: LOG_TABLE_NAME };
        const result = await docClient.send(new ScanCommand(params));
        return (result.Items || []).sort((a, b) => new Date(b.time) - new Date(a.time));
    }

    // Tìm kiếm sản phẩm theo tên và lọc theo danh mục (Category) [cite: 6]
    async search(keyword, categoryId) {
        const items = await this.getAllActive();
        let filteredResults = items;

        if (keyword) {
            const lowerKey = keyword.toLowerCase();
            filteredResults = filteredResults.filter(p =>
                p.name && p.name.toLowerCase().includes(lowerKey)
            );
        }

        if (categoryId) {
            filteredResults = filteredResults.filter(p => p.categoryId === categoryId);
        }

        return filteredResults;
    }

    // Truy vấn chi tiết một sản phẩm dựa trên ID [cite: 46]
    async getById(id) {
        const params = {
            TableName: TABLE_NAME,
            Key: { id: id }
        };
        const result = await docClient.send(new GetCommand(params));
        return result.Item;
    }

    // Cập nhật thông tin sản phẩm và ghi log thao tác
    async update(data, userId) {
        const params = {
            TableName: TABLE_NAME,
            Key: { id: data.id },
            UpdateExpression: "set #n = :name, price = :p, quantity = :q, categoryId = :c, url_image = :u",
            ExpressionAttributeNames: { "#n": "name" },
            ExpressionAttributeValues: {
                ":name": data.name,
                ":p": Number(data.price),
                ":q": Number(data.quantity),
                ":c": data.categoryId,
                ":u": data.url_image
            }
        };
        const result = await docClient.send(new UpdateCommand(params));
        await this._createLog(data.id, "UPDATE", userId);
        return result;
    }

    // Thêm mới sản phẩm, thiết lập trạng thái mặc định và ghi log
    async create(productData, userId) {
        const id = productData.id || uuidv4();
        const params = {
            TableName: TABLE_NAME,
            Item: {
                ...productData,
                id: id,
                isDeleted: false,
                createdAt: new Date().toISOString()
            }
        };
        const result = await docClient.send(new PutCommand(params));
        await this._createLog(id, "CREATE", userId);
        return result;
    }

    // Xóa mềm sản phẩm bằng cách cập nhật cờ isDeleted
    async softDelete(id, userId) {
        const params = {
            TableName: TABLE_NAME,
            Key: { id: id },
            UpdateExpression: "set isDeleted = :d",
            ExpressionAttributeValues: { ":d": true }
        };
        const result = await docClient.send(new UpdateCommand(params));
        await this._createLog(id, "DELETE", userId);
        return result;
    }
}

module.exports = new ProductRepository();