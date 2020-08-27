# Blockchain-node

### Use master branch for testing in local host.

### heroku-version brand is for web sevice.

#### There must be at least 2 server.

#### To connect node use postman to POST
##### Webserver.

```json
{
	"host": "other host name (ex: somthing.com)"
}
```
##### Local host
```json
{
	"host": "localhost",
	"port": "other node port"
}
```
##### Change port in file server.js line 15
```javascript
const PORT = process.env.PORT || 3000;
```
