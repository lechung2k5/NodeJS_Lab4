const { docClient } = require('../configs/awsConfig');
const { PutCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const TABLE_NAME = "Orders";

class OrderRepository {
    async create(orderData) {
        const params = {
            TableName: TABLE_NAME,
            Item: {
                ...orderData,
                orderDate: new Date().toISOString()
            }
        };
        return await docClient.send(new PutCommand(params));
    }

    async getAll() {
        const params = { TableName: TABLE_NAME };
        const result = await docClient.send(new ScanCommand(params));
        return result.Items || [];
    }
}

module.exports = new OrderRepository();