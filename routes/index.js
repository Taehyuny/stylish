const express = require('express');
const router = express.Router();
const Informations = require('../database/Informations');
const ShoppingBasket = require('../database/ShoppingBasket');
const Products = require('../database/Products');

/* 기본 페이지 랜더링 */
router.get('/', async(req, res) => {
    let products = await Products.find();
    if(require('../config/status').isBlocked){ return res.render('serverChecking'); }
    else{ return res.render('index', {user_id : req.session.user_id, product: products}); }
});

router.get('/product', async(req, res) => {
    if(req.param('sorting') == "DefaultSorting"){
        let products = await Products.find();
        if(require('../config/status').isBlocked){ return res.render('serverChecking'); }
        else{ return res.render('product', {user_id : req.session.user_id, products : products}); }
    }
    else if(req.param('sorting') == "Popularity"){
        let products = await Products.find().sort({purchaseAmount:-1});
        return res.render('product', {user_id : req.session.user_id, products : products});
    }
    else if(req.param('sorting') == "Price_lowtohigh"){
        let products = await Products.find().sort({price:1});
        return res.render('product', {user_id : req.session.user_id, products : products});
    }
    else if(req.param('sorting') == "Price_hightolow"){
        let products = await Products.find().sort({price:-1});
        return res.render('product', {user_id : req.session.user_id, products : products});
    }else{
        let products = await Products.find();
        if(require('../config/status').isBlocked){ return res.render('serverChecking'); }
        else{ return res.render('product', {user_id : req.session.user_id, products : products}); }
    }
});

router.post('/product', async(req, res) => {
    if(req.body.sortName == "DefaultSorting"){
        return res.send({result : true, path : `/product?sorting=DefaultSorting`});
    }
    if(req.body.sortName == "Popularity"){
        return res.send({result : true, path : `/product?sorting=Popularity`});
    }
    if(req.body.sortName == "Price_lowtohigh"){
        return res.send({result : true, path : `/product?&sorting=Price_lowtohigh`});
    }
    if(req.body.sortName == "Price_hightolow"){
        return res.send({result : true, path : `/product?&sorting=Price_hightolow`});
    }
});

router.get('/product-detail', async(req, res) => {
    let products = await Products.find();
    if(require('../config/status').isBlocked){ return res.render('serverChecking'); }
    else{ return res.render('product-detail', { user_id : req.session.user_id, products : products, productName : req.param('name'), productPrice : req.param('price')}); }
});

router.get('/cart', async(req, res) => {
    let findUserBasket = await ShoppingBasket.find({userId : req.session.user_id});
    let totalPrice = 0;
    for(let i in findUserBasket){ totalPrice += (findUserBasket[i].products.productPrice * findUserBasket[i].products.productCount); }
    
    if(require('../config/status').isBlocked){ return res.render('serverChecking'); } //totalPrice 
    else if(req.session.is_user_login){ return res.render('cart', {user_id : req.session.user_id, userBasket : findUserBasket, totalPrice : totalPrice}); }
    else {return res.send(`<script>alert('Login please.');location.href='/';</script>`);}
});

router.get('/about', (req, res) => {
    if(require('../config/status').isBlocked){ return res.render('serverChecking'); }
    else{ return res.render('about', {user_id : req.session.user_id}); }
});

router.get('/contact', (req, res) => {
    if(require('../config/status').isBlocked){ return res.render('serverChecking'); }
    else{ return res.render('contact', {user_id : req.session.user_id}); }
});

router.get('/customerCenter', (req, res) => {
    if(require('../config/status').isBlocked){ return res.render('serverChecking'); }
    else{ return res.render('customerCenter'); }
});

/* 회원가입 */
router.get('/join', (req, res) => {
    if(require('../config/status').isBlocked){ return res.render('serverChecking'); }
    else{ return res.redirect('/join.html'); }
});

router.post('/join', async(req, res) => {
    if(await Informations.findOne({id:req.body.id, pw:req.body.pw}).exec()){ return res.send(`<script>alert('아이디 또는 패스워드가 존재합니다.');location.href='/join';</script>`); }
    else{
        await Informations.create({
            name : req.body.name,
            id : req.body.id,
            pw : req.body.pw,
            phone_number : req.body.code+'-'+req.body.number2+'-'+req.body.number3,
            email : req.body.email+'@'+req.body.domain,
            address : req.body.address,
            token : ''
        });
        return res.send(`<script>alert('회원가입 완료:)');location.href='/';</script>`);
    }
});

/* 로그인, 로그아웃 */
router.get('/login', (req, res) => {
    if(req.session.is_user_login == true){ return res.send(`<script>alert('이미 로그인 되어있습니다.');location.href='/';</script>`); }
    else{ return res.redirect('/login.html'); }
});

router.post('/login', async(req, res) => {
    if(await Informations.findOne({id:req.body.id, pw:req.body.pw}).exec()){ 
        req.session.is_user_login = true;
        req.session.user_id = req.body.id;
        res.send(`<script>alert('${req.body.id}님 stylish에 오신것을 환영합니다.');location.href='/';</script>`);
    }
    else{ return res.send(`<script>alert('아이디 또는 패스워드가 잘못되었습니다.');location.href='/';</script>`); }
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    return res.send(`<script>alert('로그아웃 되었습니다.');location.href='/';</script>`);
});

/* 카트 추가 */
router.post('/cart', async(req, res) => {
    let findProduct = await Products.findOne({ name : req.body.productName });
    if(req.body.productSize == "Choose an option" || req.body.productColor == "Choose an option"){ // 기본 Choose an option은 옵션으로 선택 불가
        return res.send(`<script>alert('옵션을 모두 선택해주세요 !');</script>`); // 왜 작동 안돼지?
        // return res.send({ result : true, path : `/product-detail?name=${findProduct.name}&price=${findProduct.price}`});
    }else{
        try{
            await ShoppingBasket.create({
                userId : req.session.user_id,
                productNamekey : req.body.productName,
                products : {
                    productName : req.body.productName,
                    productPrice : req.body.productPrice,
                    productSize : req.body.productSize,
                    productColor : req.body.productColor,
                    productCount : req.body.productCount
                }    
            });
        }
        catch(err){ return res.send(`<script>alert('오류가 발생했습니다.');location.href='/product';</script>`); }
    }
    /*
        { 
        productName: 'stylish long T-shirt',
        productPrice: '8000',
        productSize: 'Size S',
        productColor: 'Black',
        productCount: '2' 
        }
    */
   
});

router.post('/cart/deleteOne', async(req, res) => {
    let findShoppingBasket = await ShoppingBasket.findOne({ productNamekey : req.body.productName });
    if(findShoppingBasket){
        await ShoppingBasket.deleteOne({ productNamekey : req.body.productName });
        return res.send(`<script>alert('상품 삭제 완료:)');location.href='/cart';</script>`);
    }
});

module.exports = router;