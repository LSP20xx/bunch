const amqp = require("amqplib/callback_api");

exports.sendMessage = (queue, msg) => {
  return new Promise((resolve, reject) => {
    amqp.connect(process.env.RABBITMQ_URL, (error0, connection) => {
      if (error0) {
        return reject(error0);
      }
      connection.createChannel((error1, channel) => {
        if (error1) {
          return reject(error1);
        }
        channel.assertQueue(queue, { durable: false });
        channel.sendToQueue(queue, Buffer.from(JSON.stringify(msg)));
        console.log(` [x] Sent ${JSON.stringify(msg)} to ${queue}`);
        resolve();
      });
    });
  });
};

exports.consumeMessages = (queue, callback) => {
  amqp.connect(process.env.RABBITMQ_URL, (error0, connection) => {
    if (error0) {
      throw error0;
    }
    connection.createChannel((error1, channel) => {
      if (error1) {
        throw error1;
      }
      channel.assertQueue(queue, { durable: false });

      console.log(
        ` [*] Waiting for messages in ${queue}. To exit press CTRL+C`
      );

      channel.consume(
        queue,
        async (msg) => {
          console.log(` [x] Received ${msg.content.toString()}`);
          await callback(JSON.parse(msg.content.toString()));
        },
        { noAck: true }
      );
    });
  });
};
