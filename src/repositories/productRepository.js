const { docClient } = require('../configs/awsConfig');
const { ScanCommand, PutCommand, UpdateCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");

const TABLE_NAME = "Products";

class ProductRepository {
    // Lấy tất cả sản phẩm đang hoạt động
    async getAllActive() {
        const params = {
            TableName: TABLE_NAME,
            FilterExpression: "isDeleted = :d",
            ExpressionAttributeValues: { ":d": false }
        };
        const result = await docClient.send(new ScanCommand(params));
        return result.Items || [];
    }
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

    // Lấy chi tiết một sản phẩm theo ID (Dùng cho trang Edit)
    async getById(id) {
        const params = {
            TableName: TABLE_NAME,
            Key: { id: id }
        };
        const result = await docClient.send(new GetCommand(params));
        return result.Item;
    }

    async update(data) {
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
        return await docClient.send(new UpdateCommand(params));
    }

    async create(productData) {
        const params = {
            TableName: TABLE_NAME,
            Item: {
                ...productData,
                isDeleted: false
            }
        };
        return await docClient.send(new PutCommand(params));
    }

    async softDelete(id) {
        const params = {
            TableName: TABLE_NAME,
            Key: { id: id },
            UpdateExpression: "set isDeleted = :d",
            ExpressionAttributeValues: { ":d": true }
        };
        return await docClient.send(new UpdateCommand(params));
    }

}

module.exports = new ProductRepository();