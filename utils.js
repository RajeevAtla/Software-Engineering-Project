class Publisher { // corresponds to EventType in Figure 3-18
	#subscribers;

	constructor() { // Using Set ensures that each subscriber subscribed no more than once
		this.#subscribers = new Set();
	}

	subscribe(handlerFn) {
		this.#subscribers.add(handlerFn);
	}

	unsubscribe(handlerFn) {
		return this.#subscribers.delete(handlerFn);
	}

	publish(eventProperties) {
		this.#subscribers.forEach(
			handlerFn => handlerFn(eventProperties)
		);
	}
}

class TerminalBonder {
	#value_ = 0; // here the final calculation result will be stored

	get value() {
		return this.#value_;
	}

	 // binds the final calculation() function to a given event source
	 // and stores the calculated value; returns the 'source' publisher
	bind( source, calculation ) {
		let self = this; // closure variable - to capture “this” in a closure

		source.subscribe( function(eventProperties) { // event handler function
			self.#value_ = calculation(eventProperties);
			// console.log("value = " + self.#value_);
		});

		return source; // returns the 'source' publisher (better than NULL ...)
	}
}

module.exports = {
    Publisher: Publisher,
    TerminalBonder: TerminalBonder
}
