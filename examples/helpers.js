
var zlib = require('zlib');

/**
 * Get a stream transform to decompress an HTTP response (or null, if none required).
 *
 * NOTE: Does not handle 'compress', but in practice no-one has used that since the 90's.
 *
 * @param {http.ServerResponse} response - The server response to get a decompressor for.
 * @returns {*} - A stream.Transform, or null if no decompression required.
 */
function decompressorFor(response) {
    var contentEncoding = response.headers['content-encoding'];
    switch (contentEncoding) {
        case 'x-gzip':
        case 'gzip':
            return zlib.createGunzip();
        case 'deflate':
            return zlib.createInflate();
        default:
            return null;
    }
}

/**
 * Transform the server's response and send it to the proxy client.
 *
 * @param {http.ServerResponse} clientRes - Response to the client.
 * @param {http.IncomingMessage} response - Response from the server.
 * @param {transformCallback} transform - How to transform the server's response.
 */
function sendModifiedResponse(clientRes, response, transform) {
    var dataPipe = response,
        decompressor = decompressorFor(response),
        chunks = [];

    if(decompressor) {
        dataPipe = dataPipe.pipe(decompressor);
    }
    dataPipe.on('data', function(chunk) {
        chunks.push(chunk);
    });
    dataPipe.on('end', function () {
        var origContent = Buffer.concat(chunks);
        transform(origContent, function (modifiedContent) {
            response.headers['content-length'] = modifiedContent.length;
            // The response has been de-chunked and uncompressed, so delete
            // these headers from the response.
            delete response.headers['content-encoding'];
            delete response.headers['content-transfer-encoding'];
            clientRes.writeHead(response.statusCode, response.headers);
            clientRes.end(modifiedContent);
        });
    });
}

/**
 * Transform server response content.
 *
 * There's no error value, because even if the transform fails, *something* should be returned
 * to the client. Figuring out what that should be is application-specific (i.e, your problem).
 *
 * @callback transformCallback
 * @param {Buffer} input - The server's response content.
 * @returns {Buffer} - The transformed response.
 */


/**
 * Send a server response to the proxy client as-is, without modification.
 *
 * @param {http.ServerResponse} clientRes - Response to the client.
 * @param {http.IncomingMessage} response - Response from the server (to send).
 */
function sendOriginalResponse(clientRes, response) {
    clientRes.writeHead(response.statusCode, response.headers);
    response.pipe(clientRes);
}

module.exports = {
    sendModifiedResponse: sendModifiedResponse,
    sendOriginalResponse: sendOriginalResponse
};
