import { Socket } from 'dgram'
import { connect } from 'net'


// SMTP error code ref: https://datatracker.ietf.org/doc/html/rfc5321#section-4.2.3

function validateSMTP(exchange, emailAddress) {

	return new Promise((resolve, reject) => {


		// a list of SMTP commands to run before an email address is considered valid
		let smtpCommands = [

			'EHLO ' + exchange,
			'MAIL FROM: <bballermos@gmail.com>',
			'RCPT TO: <' + emailAddress + '>'

		]

		// create a client that should connect to port 25
		const client = connect(25, exchange)

		client.setEncoding('ascii')
		client.setTimeout(10e3)


		// on success
		client.on('success', () => {

			client.write('quit\r\n')
			client.end()
			client.destroy()

			return resolve({
				exchange,
				emailAddress
			})
		})

		client.on('next', () => {

			// if there are no commands are empty
			// emit success to close the connection and resolve the email address
			// if the commands are empty, it means that the smtp was able to send through the email address, thus the address is valid
			if ( !smtpCommands?.length ) return client.emit('success')

			return client.writable ? 
				client.write(smtpCommands.shift()):
				client.emit( 'error', 'SMTP connected closed unexpectedly' )

		})

		// start listening to the data only after the client is connected
		client.on('connect', () => {

			client.on('data', data => {
				console.log('DATA: ' + data)

				if ( !data?.length ) return client.emit('error', data)

				// catch the status code of every message
				// and convert to integer
				const statusCode = parseInt(data?.split(' ')[0])

				if ( statusCode === 220 || statusCode == 250 ) return client.emit( 'next', data )

				return client.emit( 'error', data )


			})

		})

		client.on( 'timeout', ()=> {

			console.log( 'connection timed out' )
			client.emit( 'error', 'Connection Timedout' )
		})


		// listen to the client errors
		client.on('error', err=> {
			console.log('Error ', err)
			reject(err)
		})


		// listen to when the client's connection is closed
		client.on('close', ()=> 
			console.log('Connection closed'))

	})

}
export { validateSMTP }