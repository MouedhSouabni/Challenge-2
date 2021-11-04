
import { Socket, connect, createConnection } from 'net'


// SMTP error code ref: https://datatracker.ietf.org/doc/html/rfc5321#section-4.2.3

function validateSMTP(exchange: string, emailAddress: string): Promise<boolean> {

	return new Promise((resolve, reject) => {


		// a list of SMTP commands to run before an email address is considered valid
		let smtpCommands: string[] = [

			'EHLO ' + exchange + '\r\n',
			'MAIL FROM: <bballermos@gmail.com>\r\n',
			'RCPT TO: <' + emailAddress + '>\r\n'

		]

		// create a client that should connect to port 25
		const client: Socket = createConnection(25, exchange)

		client.setEncoding('ascii')
		client.setTimeout(10e3)


		// on success
		client.on('success', () => {

			client.write('quit\r\n')
			client.end()
			client.destroy()

			return resolve(true)
		})

		client.on('next', () => {

			// if there are no commands are empty
			// emit success to close the connection and resolve the email address
			// if the commands are empty, it means that the smtp was able to send through the email address, thus the address is valid
			if ( !smtpCommands?.length ) return client.emit('success')

			return client.writable ? 
				client.write(smtpCommands.shift() as string):
				client.emit( 'error', 'SMTP connected closed unexpectedly' )

		})

		// start listening to the data only after the client is connected
		client.on('connect', () => {

			client.on('data', (data: string) => {
				// console.log('DATA: ' + data)

				if ( !data?.length ) return client.emit('error', data)

				// catch the status code of every message
				// and convert to integer
				const statusCode: number = parseInt(data?.split(' ')[0])

				switch ( statusCode ) {

					case 220:
						return client.emit( 'next', data );

					case 250:
						return client.emit( 'next', data );

					default: 
						return client.emit( 'error', data )
				}


			})

		})

		client.on( 'timeout', ()=> {

			// console.log( 'connection timed out' )
			client.emit( 'error', 'Connection Timedout' )
		})


		// listen to the client errors
		client.on('error', (err: Error)=> {
			console.log('Error ', err)
			resolve(false)
		})


		// listen to when the client's connection is closed
		client.on('close', ()=> {
			console.log('Connection closed')
			client.emit( 'error', 'Connection closed' )
		})

	})

}
export { validateSMTP }