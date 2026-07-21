const DB={
  users:()=>JSON.parse(localStorage.getItem('ss_users')||'[]'),
  products:()=>JSON.parse(localStorage.getItem('ss_products')||'[]'),
  orders:()=>JSON.parse(localStorage.getItem('ss_orders')||'[]'),
  cart:()=>JSON.parse(localStorage.getItem('ss_cart')||'[]'),
  session:()=>JSON.parse(localStorage.getItem('ss_session')||'null'),
  save:(k,d)=>localStorage.setItem('ss_'+k,JSON.stringify(d))
};

const CAT_EMOJI={Electronics:'⚡',Fashion:'👗',Home:'🏠',Books:'📚',Sports:'⚽',Beauty:'💄'};
const CAT_COLORS={Electronics:{bg:'#eff6ff',color:'#2563eb'},Fashion:{bg:'#fdf4ff',color:'#9333ea'},Home:{bg:'#f0fdf4',color:'#16a34a'},Books:{bg:'#fffbeb',color:'#d97706'},Sports:{bg:'#f0f9ff',color:'#0284c7'},Beauty:{bg:'#fdf2f8',color:'#db2777'}};
const BADGE_STYLES={NEW:'background:#dcfce7;color:#16a34a',HOT:'background:#fee2e2;color:#dc2626',SALE:'background:#fef3c7;color:#d97706',TOP:'background:#f3e8ff;color:#9333ea'};
const STATUS_BADGE={Confirmed:'badge-blue',Shipped:'badge-amber',Delivered:'badge-green',Cancelled:'badge-red'};

function initDB(){
  if(!DB.users().length) DB.save('users',[{id:1,name:'Rajesh Soyeda',email:'user@shop.com',password:'user123',role:'user'},{id:2,name:'Admin User',email:'admin@shop.com',password:'admin123',role:'admin'}]);
  if(!DB.products().length) DB.save('products',[
    {id:1,name:'iPhone 15 Pro',price:134900,original:154900,category:'Electronics',stock:50,desc:'Apple A17 Pro chip, titanium design, 48MP camera system with 5x optical zoom.',emoji:'📱',badge:'HOT',rating:4.8,reviews:2341},
    {id:2,name:'Sony WH-1000XM5',price:24990,original:34990,category:'Electronics',stock:30,desc:'Industry-leading noise cancellation with crystal clear hands-free calling.',emoji:'🎧',badge:'TOP',rating:4.7,reviews:1876},
    {id:3,name:'Nike Air Max 270',price:9995,original:12995,category:'Sports',stock:100,desc:'Max Air cushioning for all-day comfort. Mesh upper for breathability.',emoji:'👟',badge:'SALE',rating:4.5,reviews:983},
    {id:4,name:'Samsung 65" 4K TV',price:89999,original:129999,category:'Electronics',stock:20,desc:'OLED display with Quantum Dot technology for vibrant colors and deep blacks.',emoji:'📺',badge:'NEW',rating:4.6,reviews:654},
    {id:5,name:"Levi's 511 Slim Jeans",price:3499,original:4999,category:'Fashion',stock:200,desc:'Classic slim fit with stretch fabric for all-day comfort.',emoji:'👖',badge:'',rating:4.3,reviews:4521},
    {id:6,name:'IKEA Ergonomic Chair',price:12999,original:16999,category:'Home',stock:40,desc:'Ergonomic chair with lumbar support, adjustable armrests, breathable mesh.',emoji:'🪑',badge:'',rating:4.4,reviews:789},
    {id:7,name:'Atomic Habits',price:399,original:599,category:'Books',stock:500,desc:"James Clear's proven framework to build good habits and break bad ones.",emoji:'📗',badge:'TOP',rating:4.9,reviews:12043},
    {id:8,name:'boAt Airdopes 141',price:1299,original:3990,category:'Electronics',stock:300,desc:'True wireless earbuds, 42hr playback, ENx tech for clear calls.',emoji:'🎵',badge:'SALE',rating:4.2,reviews:54321},
    {id:9,name:'Premium Yoga Mat',price:1499,original:2499,category:'Sports',stock:150,desc:'6mm anti-slip mat with alignment lines and carrying strap.',emoji:'🧘',badge:'',rating:4.5,reviews:2109},
    {id:10,name:'Lakme Vitamin C Serum',price:549,original:799,category:'Beauty',stock:250,desc:'Brightening serum with SPF 15 for glowing skin.',emoji:'✨',badge:'NEW',rating:4.1,reviews:3342},
    {id:11,name:'MacBook Air M2',price:114900,original:124900,category:'Electronics',stock:25,desc:'M2 chip, 13.6" Liquid Retina display, up to 18-hour battery life.',emoji:'💻',badge:'HOT',rating:4.9,reviews:4567},
    {id:12,name:'Puma Dri-Fit T-Shirt',price:999,original:1799,category:'Fashion',stock:500,desc:'Moisture management technology, regular fit for all-day wear.',emoji:'👕',badge:'SALE',rating:4.0,reviews:7654}
  ]);
  if(!DB.orders().length) DB.save('orders',[
    {id:'ORD-001',userId:1,items:[{productId:7,name:'Atomic Habits',qty:1,price:399}],total:399,status:'Delivered',address:'Bhopal, MP',payment:'UPI',date:new Date(Date.now()-7*86400000).toISOString()},
    {id:'ORD-002',userId:1,items:[{productId:8,name:'boAt Airdopes',qty:1,price:1299}],total:1299,status:'Shipped',address:'Bhopal, MP',payment:'Card',date:new Date(Date.now()-2*86400000).toISOString()}
  ]);
}
