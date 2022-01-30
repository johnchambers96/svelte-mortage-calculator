
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
        select.selectedIndex = -1; // no option should be selected
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.3' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/App.svelte generated by Svelte v3.46.3 */

    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	child_ctx[17] = i;
    	const constants_0 = /*i*/ child_ctx[17] + 1;
    	child_ctx[15] = constants_0;
    	return child_ctx;
    }

    // (74:10) {#each Array(35) as _, i}
    function create_each_block(ctx) {
    	let option;

    	let t_value = (/*i*/ ctx[17] === 0
    	? `${/*year*/ ctx[15]} year`
    	: `${/*year*/ ctx[15]} years`) + "";

    	let t;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = /*year*/ ctx[15];
    			option.value = option.__value;
    			add_location(option, file, 75, 12, 1997);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(74:10) {#each Array(35) as _, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let meta0;
    	let meta1;
    	let html;
    	let t0;
    	let main;
    	let h2;
    	let t2;
    	let div6;
    	let div2;
    	let div0;
    	let label0;
    	let t4;
    	let input0;
    	let t5;
    	let div1;
    	let label1;
    	let t6;
    	let t7_value = (`(${(/*deposit*/ ctx[1] / /*price*/ ctx[0] * 100).toFixed()}%)` || "") + "";
    	let t7;
    	let t8;
    	let input1;
    	let t9;
    	let div5;
    	let div3;
    	let label2;
    	let t11;
    	let select;
    	let t12;
    	let div4;
    	let label3;
    	let t14;
    	let input2;
    	let t15;
    	let section;
    	let p0;
    	let t16_value = `£${/*monthlyCost*/ ctx[4].toFixed()}` + "";
    	let t16;
    	let t17;
    	let p1;
    	let mounted;
    	let dispose;
    	let each_value = Array(35);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			meta0 = element("meta");
    			meta1 = element("meta");
    			html = element("html");
    			t0 = space();
    			main = element("main");
    			h2 = element("h2");
    			h2.textContent = "Mortage Calculator";
    			t2 = space();
    			div6 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Price";
    			t4 = space();
    			input0 = element("input");
    			t5 = space();
    			div1 = element("div");
    			label1 = element("label");
    			t6 = text("Deposit ");
    			t7 = text(t7_value);
    			t8 = space();
    			input1 = element("input");
    			t9 = space();
    			div5 = element("div");
    			div3 = element("div");
    			label2 = element("label");
    			label2.textContent = "Repayment term";
    			t11 = space();
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t12 = space();
    			div4 = element("div");
    			label3 = element("label");
    			label3.textContent = "Interest rate";
    			t14 = space();
    			input2 = element("input");
    			t15 = space();
    			section = element("section");
    			p0 = element("p");
    			t16 = text(t16_value);
    			t17 = space();
    			p1 = element("p");
    			p1.textContent = "per month";
    			document.title = "Svelte Mortage Calculator";
    			attr_dev(meta0, "name", "robots");
    			attr_dev(meta0, "content", "noindex nofollow");
    			add_location(meta0, file, 23, 2, 551);
    			attr_dev(meta1, "name", "description");
    			attr_dev(meta1, "content", "Simple web application to calculate monthly mortage repayments");
    			add_location(meta1, file, 24, 2, 603);
    			attr_dev(html, "lang", "en");
    			add_location(html, file, 28, 2, 716);
    			attr_dev(h2, "class", "svelte-yhdx1l");
    			add_location(h2, file, 32, 2, 760);
    			attr_dev(label0, "for", "price");
    			attr_dev(label0, "class", "svelte-yhdx1l");
    			add_location(label0, file, 36, 8, 899);
    			attr_dev(input0, "id", "price");
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "min", "0.0");
    			attr_dev(input0, "step", "1000");
    			attr_dev(input0, "aria-label", "Price");
    			attr_dev(input0, "placeholder", "Price");
    			attr_dev(input0, "class", "svelte-yhdx1l");
    			add_location(input0, file, 37, 8, 942);
    			attr_dev(div0, "class", "input-field svelte-yhdx1l");
    			add_location(div0, file, 35, 6, 865);
    			attr_dev(label1, "for", "despoit");
    			attr_dev(label1, "class", "svelte-yhdx1l");
    			add_location(label1, file, 49, 8, 1236);
    			attr_dev(input1, "id", "despoit");
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "min", "0.0");
    			attr_dev(input1, "step", "1000");
    			attr_dev(input1, "aria-label", "Despoit");
    			attr_dev(input1, "placeholder", "Deposit Amount");
    			attr_dev(input1, "class", "svelte-yhdx1l");
    			add_location(input1, file, 52, 8, 1353);
    			attr_dev(div1, "class", "input-field svelte-yhdx1l");
    			add_location(div1, file, 48, 6, 1202);
    			attr_dev(div2, "class", "input-container__row svelte-yhdx1l");
    			add_location(div2, file, 34, 4, 824);
    			attr_dev(label2, "for", "term");
    			attr_dev(label2, "class", "svelte-yhdx1l");
    			add_location(label2, file, 66, 8, 1712);
    			attr_dev(select, "id", "term");
    			attr_dev(select, "aria-label", "Repayment term");
    			attr_dev(select, "class", "svelte-yhdx1l");
    			if (/*term*/ ctx[2] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[10].call(select));
    			add_location(select, file, 67, 8, 1763);
    			attr_dev(div3, "class", "input-field svelte-yhdx1l");
    			add_location(div3, file, 65, 6, 1678);
    			attr_dev(label3, "for", "interest");
    			attr_dev(label3, "class", "svelte-yhdx1l");
    			add_location(label3, file, 82, 8, 2189);
    			attr_dev(input2, "id", "interest");
    			attr_dev(input2, "type", "number");
    			attr_dev(input2, "min", "0.01");
    			attr_dev(input2, "step", "0.01");
    			attr_dev(input2, "aria-label", "Interest rate");
    			attr_dev(input2, "placeholder", "Interest rate");
    			attr_dev(input2, "class", "svelte-yhdx1l");
    			add_location(input2, file, 83, 8, 2243);
    			attr_dev(div4, "class", "input-field svelte-yhdx1l");
    			add_location(div4, file, 81, 6, 2155);
    			attr_dev(div5, "class", "input-container__row svelte-yhdx1l");
    			add_location(div5, file, 64, 4, 1637);
    			attr_dev(div6, "class", "input-container svelte-yhdx1l");
    			add_location(div6, file, 33, 2, 790);
    			attr_dev(p0, "class", "monthly-figure svelte-yhdx1l");
    			add_location(p0, file, 97, 4, 2592);
    			attr_dev(p1, "class", "per-month svelte-yhdx1l");
    			add_location(p1, file, 100, 4, 2668);
    			attr_dev(section, "class", "monthly-total-container svelte-yhdx1l");
    			add_location(section, file, 96, 2, 2546);
    			attr_dev(main, "class", "svelte-yhdx1l");
    			add_location(main, file, 31, 0, 751);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, meta0);
    			append_dev(document.head, meta1);
    			append_dev(document.head, html);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, h2);
    			append_dev(main, t2);
    			append_dev(main, div6);
    			append_dev(div6, div2);
    			append_dev(div2, div0);
    			append_dev(div0, label0);
    			append_dev(div0, t4);
    			append_dev(div0, input0);
    			set_input_value(input0, /*price*/ ctx[0]);
    			append_dev(div2, t5);
    			append_dev(div2, div1);
    			append_dev(div1, label1);
    			append_dev(label1, t6);
    			append_dev(label1, t7);
    			append_dev(div1, t8);
    			append_dev(div1, input1);
    			set_input_value(input1, /*deposit*/ ctx[1]);
    			append_dev(div6, t9);
    			append_dev(div6, div5);
    			append_dev(div5, div3);
    			append_dev(div3, label2);
    			append_dev(div3, t11);
    			append_dev(div3, select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*term*/ ctx[2]);
    			append_dev(div5, t12);
    			append_dev(div5, div4);
    			append_dev(div4, label3);
    			append_dev(div4, t14);
    			append_dev(div4, input2);
    			set_input_value(input2, /*interestRate*/ ctx[3]);
    			append_dev(main, t15);
    			append_dev(main, section);
    			append_dev(section, p0);
    			append_dev(p0, t16);
    			append_dev(section, t17);
    			append_dev(section, p1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[6]),
    					listen_dev(input0, "change", /*change_handler*/ ctx[7], false, false, false),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[8]),
    					listen_dev(input1, "change", /*change_handler_1*/ ctx[9], false, false, false),
    					listen_dev(select, "change", /*select_change_handler*/ ctx[10]),
    					listen_dev(select, "change", /*change_handler_2*/ ctx[11], false, false, false),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[12]),
    					listen_dev(input2, "change", /*change_handler_3*/ ctx[13], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*price*/ 1 && to_number(input0.value) !== /*price*/ ctx[0]) {
    				set_input_value(input0, /*price*/ ctx[0]);
    			}

    			if (dirty & /*deposit, price*/ 3 && t7_value !== (t7_value = (`(${(/*deposit*/ ctx[1] / /*price*/ ctx[0] * 100).toFixed()}%)` || "") + "")) set_data_dev(t7, t7_value);

    			if (dirty & /*deposit*/ 2 && to_number(input1.value) !== /*deposit*/ ctx[1]) {
    				set_input_value(input1, /*deposit*/ ctx[1]);
    			}

    			if (dirty & /*term*/ 4) {
    				select_option(select, /*term*/ ctx[2]);
    			}

    			if (dirty & /*interestRate*/ 8 && to_number(input2.value) !== /*interestRate*/ ctx[3]) {
    				set_input_value(input2, /*interestRate*/ ctx[3]);
    			}

    			if (dirty & /*monthlyCost*/ 16 && t16_value !== (t16_value = `£${/*monthlyCost*/ ctx[4].toFixed()}` + "")) set_data_dev(t16, t16_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			detach_dev(meta0);
    			detach_dev(meta1);
    			detach_dev(html);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let { price = 250000 } = $$props;
    	let { deposit = 25000 } = $$props;
    	let { term = 25 } = $$props;
    	let { interestRate = 2 } = $$props;
    	let { monthlyCost = 0 } = $$props;

    	const handleCalculation = () => {
    		// monthly interest rate
    		const i = interestRate / 100 / 12;

    		// total months
    		const t = term * 12;

    		// total loan amount
    		const p = price - deposit;

    		$$invalidate(4, monthlyCost = p > 0
    		? p * i * Math.pow(1 + i, t) / (Math.pow(1 + i, t) - 1)
    		: 0);
    	};

    	handleCalculation();
    	const writable_props = ['price', 'deposit', 'term', 'interestRate', 'monthlyCost'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		price = to_number(this.value);
    		$$invalidate(0, price);
    	}

    	const change_handler = () => handleCalculation();

    	function input1_input_handler() {
    		deposit = to_number(this.value);
    		$$invalidate(1, deposit);
    	}

    	const change_handler_1 = () => handleCalculation();

    	function select_change_handler() {
    		term = select_value(this);
    		$$invalidate(2, term);
    	}

    	const change_handler_2 = () => handleCalculation();

    	function input2_input_handler() {
    		interestRate = to_number(this.value);
    		$$invalidate(3, interestRate);
    	}

    	const change_handler_3 = () => handleCalculation();

    	$$self.$$set = $$props => {
    		if ('price' in $$props) $$invalidate(0, price = $$props.price);
    		if ('deposit' in $$props) $$invalidate(1, deposit = $$props.deposit);
    		if ('term' in $$props) $$invalidate(2, term = $$props.term);
    		if ('interestRate' in $$props) $$invalidate(3, interestRate = $$props.interestRate);
    		if ('monthlyCost' in $$props) $$invalidate(4, monthlyCost = $$props.monthlyCost);
    	};

    	$$self.$capture_state = () => ({
    		price,
    		deposit,
    		term,
    		interestRate,
    		monthlyCost,
    		handleCalculation
    	});

    	$$self.$inject_state = $$props => {
    		if ('price' in $$props) $$invalidate(0, price = $$props.price);
    		if ('deposit' in $$props) $$invalidate(1, deposit = $$props.deposit);
    		if ('term' in $$props) $$invalidate(2, term = $$props.term);
    		if ('interestRate' in $$props) $$invalidate(3, interestRate = $$props.interestRate);
    		if ('monthlyCost' in $$props) $$invalidate(4, monthlyCost = $$props.monthlyCost);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		price,
    		deposit,
    		term,
    		interestRate,
    		monthlyCost,
    		handleCalculation,
    		input0_input_handler,
    		change_handler,
    		input1_input_handler,
    		change_handler_1,
    		select_change_handler,
    		change_handler_2,
    		input2_input_handler,
    		change_handler_3
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			price: 0,
    			deposit: 1,
    			term: 2,
    			interestRate: 3,
    			monthlyCost: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get price() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set price(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get deposit() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set deposit(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get term() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set term(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get interestRate() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set interestRate(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get monthlyCost() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set monthlyCost(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
      target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
