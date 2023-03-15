import mixpanel from 'mixpanel-browser';

const PROD_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL || "5fa23edbf619e78b0fc68a47f493167d";
mixpanel.init(PROD_TOKEN);
mixpanel.set_config({
    ip: true,
    ignore_dnt: true,
});
let actions = {
    identify: (id: any) => {
        mixpanel.identify(id);
    },
    alias: (id: any) => {
        mixpanel.alias(id);
    },
    track: (name: any, props: any) => {
        mixpanel.track(name, props);
    },
    people: {
        set: (props: any) => {
            mixpanel.people.set(props);
        },
    },
};

export let Mixpanel = actions;
