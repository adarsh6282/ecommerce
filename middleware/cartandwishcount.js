const userSchema=require("../models/userModel")
const cartSchema=require("../models/cartModel")
const wishlistSchema=require("../models/wishlistSchema")

const cartCount=async (req, res, next) => {
    try {
                const {email} = req.session.userData
            const user=await userSchema.findOne({email})
            const userId = user.id;

            const cart = await cartSchema.findOne({ userId }).populate('items.productId');

            const cartCount = cart ? cart.items.length : 0;

            res.locals.cartCount = cartCount;
        next();
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.locals.cartCount = 0;
        next();
    }
}

const wishCount=async (req, res, next) => {
    try {
                const {email} = req.session.userData
                console.log(email)
            const user=await userSchema.findOne({email})
            const userId = user.id;

            const wishlist = await wishlistSchema.findOne({ userId }).populate('products.productId');

            const wishlistCount = wishlist ? wishlist.products.length : 0;

            res.locals.wishlistCount = wishlistCount;
        next();
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.locals.wishlistCount = 0;
        next();
    }
}

module.exports={cartCount, wishCount}