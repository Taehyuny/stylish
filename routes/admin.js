const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const jsonfile = require('jsonfile');
const ADMIN_ACCOUNT = require('../config/ADMIN_ACCOUNT');
const Informations = require('../database/Informations');
const QuestionAnswer = require('../database/QuestionAnswer');
const Products = require('../database/Products');

/* admin 로그인, 로그아웃 */
router.get('/', async(req,res) => {
    if(req.session.is_admin_login){
        let usersInfo = await Informations.find();
        let q_a = await QuestionAnswer.find();
        let products = await Products.find();
        return res.render('admin', {users_info : usersInfo,  q_a : q_a, products : products});
    }
    else{ return res.redirect('/admin_auth.html'); }
});

router.post('/', (req, res) => {
    if(req.body.id === ADMIN_ACCOUNT.username && req.body.pw === ADMIN_ACCOUNT.password){
        req.session.is_admin_login = true;
        return res.redirect('/admin'); 
    }
    else{ return res.redirect('/'); }
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    return res.send(`<script>alert('##로그아웃##');location.href='/';</script>`);
});

/* Q&A 답변 */
router.post('/answer', async(req, res) => {
    let findQuestion = await QuestionAnswer.findOne({writer : req.body.writer, title : req.body.title, text : req.body.text});
    if(findQuestion){
        await QuestionAnswer.updateOne({_id : findQuestion._id}, {answer : req.body.answer, status : true});
        return res.send(`<script>alert('답변 완료하였습니다.');location.href='/admin';</script>`);
    }
    else{ return res.send(`<script>alert('오류가 발생했습니다.');location.href='/';</script>`); }
});

/* 상품 추가, 상품 삭제, 상품 재고 및 가격 수정   */
router.post('/product/add', async(req, res) => {
    await Products.create({
        name : req.body.productName,
        price : req.body.productPrice,
        category : {
            highCategory : req.body.high,
            lowCategory : req.body.low
        }
    });
    return res.send(`<script>alert('상품 생성 완료:)');location.href='/admin';</script>`);
});

router.post('/product/delete', async(req, res) => {
    await Products.deleteOne({name : req.body.productName});
    return res.send(`<script>alert('상품 삭제 완료:)');location.href='/admin';</script>`);
});

router.post('/product/amount/change', async(req, res) => {
    let findProducts = await Products.findOne({name : req.body.productName, purchaseAmount : req.body.productPurchaseAmout});
    if(findProducts){
        await Products.updateOne({_id : findProducts._id},{stock : req.body.productStock, price : req.body.productPrice});
        return res.send(`<script>alert('수량 및 가격 수정 완료:)');location.href='/admin';</script>`);
    }
});

/* 고객(사용자)들에게 이메일 보내는 기능 */
router.post('/email', async(req, res) => {
    let usersInfo = await Informations.find();
    let usersEmailAddress='';

    for(i in usersInfo){ usersEmailAddress += usersInfo[i].email + ', '; }
    
    let transporter = nodemailer.createTransport({
        service : 'naver',
        auth : {
            user : `${ADMIN_ACCOUNT.email_address}`,
            pass : `${ADMIN_ACCOUNT.email_password}`
        }
    });

    let mailOption = {
        from : `stylish 관리자 <${ADMIN_ACCOUNT.email_address}>`,
        to : `${users_email_address.substring(0, usersEmailAddress.length-2)}`,
        subject : `${req.body.eventSubject}`,
        text : `${req.body.eventMessage}`
    }
    
    transporter.sendMail(mailOption, function(err, info){
        if(err){ return res.send(`<script>alert('error');location.href='/admin';</script>`); }
        else{ return res.send(`<script>alert('success');location.href='/admin';</script>`); }
    });

});

/* 사용자 계정 삭제 */
router.post('/user/delete', async(req, res) => {
    await Informations.deleteOne({id : req.body.delete});
    return res.send(`<script>alert('삭제되었습니다.');location.href='/admin';</script>`);
});

/* 서버 점검 */
router.post('/server/check', (req, res) => {
    let status = require('../config/status');
    status.isBlocked = !status.isBlocked;
    
    jsonfile.writeFile(__dirname + '/../config/status.json', status, {spaces : 2}, err => {
        if(err){ return res.send("<script>alert('알 수 없는 에러 발생');location.href='/admin'</script>"); }
        else{
            if (status.isBlocked) { return res.send("<script>alert('서버점검');location.href='/admin'</script>");} 
            else { return res.send("<script>alert('서비스 정상 진행');location.href='/admin'</script>"); }    
        }
    }); 
}); 

module.exports = router;