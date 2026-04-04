import mongoose, {Schema} from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';


export const subscriptionSchema = new Schema({
    subscriber:{
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    channel:{
        type: Schema.Types.ObjectId,
        ref: "User"
    },
}, {timestamps:true});

subscriptionSchema.plugin(mongooseAggregatePaginate);
subscriptionSchema.index({subscriber: 1, channel: 1}, {unique: true}); // one sub doc per pair
subscriptionSchema.index({channel: 1}); // getSubscribers queries by channel
subscriptionSchema.index({subscriber: 1}); // getSubscribedChannels queries by subscriber

export const Subscription = mongoose.model("Subscription", subscriptionSchema);