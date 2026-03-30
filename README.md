@MomsFriendlyDevCo/Sanity
=========================
Sanity checking framework.

```javascript
import email from '@momsfriendlydevco/email';

export default {
	id: 'email',
	frequency: '1h',
	handler() {
		return email()
			.to('null@mfdc.dev')
			.from('someone@somewhere.com')
			.subject('Email sanity check')
			.text(`This is a test of the email dispatch system\n\nPlease disreguard this email`)
			.send()
			.then(()=> 'PASS: Email sent successfully')
			.catch(e => `WARN: ${e.toString()}`)
	},
};
```



Trapping top-level errors
-------------------------
To trap top-level errors set `isolate: true` within a Sanity module.

```javascript
export default {
	id: 'topLevelThrow',
	frequency: '1s',
	isolate: true,
	handler() {
		setTimeout(()=> {
			throw new Error('Top level error');
		});

		return new Promise(resolve => {
			setTimeout(()=> resolve('Pass: Throw exit inner thread'), 1000);
		});
	},
}
```
