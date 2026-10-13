import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, ChevronLeft, ChevronRight, Flame, HeartHandshake, House, Info, List, MapPin, Menu, MessageCircle, Minus, Phone, Plus, ShoppingBag, Tag, Trash2, X } from 'lucide-react';
import { directionsUrl, whatsappUrl } from './data/business';
import { heroBanners } from './data/heroBanners';
import ImportantNotice from './components/ImportantNotice';
import ExitEnquiry from './components/ExitEnquiry';
import { money } from './lib/money';
import { goSection, usePathname } from './lib/navigate';
import { usePublicCatalog } from './lib/firestoreCatalog';
import { applyPageMeta } from './lib/seo';
import { orderStatusLabel, saveOrder, useCustomerOrder } from './lib/orders';
import ProductListPage from './pages/ProductList';
import ProductGallery from './components/ProductGallery';
import ProductDescription from './components/ProductDescription';
import { Analytics } from '@vercel/analytics/react';

const AdminPage = lazy(() => import('./pages/admin/AdminPage.jsx'));
import './App.css';
import './overrides.css';
const scrollToId = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
function Brand(){return <a className="brand" href="/" onClick={event=>{event.preventDefault();goSection('home')}} aria-label="Shri Harish Crackers home"><img src="/image.png" alt="Shri Harish Crackers logo"/><span><b>SHRI HARISH</b><strong>CRACKERS</strong><small>VALLIYUR</small></span></a>}
function Navbar({count,bump,onCart}){const[open,setOpen]=useState(false);const links=[['Home','home'],['About Us','about'],['Offers','offers'],['Product List','product-list'],['Contact Us','contact']];const onList=typeof window!=='undefined'&&window.location.pathname.replace(/\/+$/,'')==='/product-list';const go=id=>{setOpen(false);goSection(id)};return <header className="site-header"><div className="nav-shell"><Brand/><nav className="desktop-nav">{links.map(([label,id])=><a key={id} href={id==='product-list'?'/product-list':id==='home'?'/':`/#${id}`} onClick={event=>{event.preventDefault();go(id)}} aria-current={id==='product-list'&&onList?'page':undefined}>{label}</a>)}</nav><div className="nav-actions"><button className={`cart-trigger ${bump?'cart-bump':''}`} onClick={onCart} aria-label={`Open cart, ${count} items`}><ShoppingBag size={20}/><span>{count}</span><em>Cart</em></button><button className="menu-trigger" onClick={()=>setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>{open?<X/>:<Menu/>}</button></div></div><nav className={`mobile-menu ${open?'is-open':''}`}>{links.map(([label,id])=><a key={id} href={id==='product-list'?'/product-list':id==='home'?'/':`/#${id}`} onClick={event=>{event.preventDefault();go(id)}} aria-current={id==='product-list'&&onList?'page':undefined}>{label}<ArrowRight size={16}/></a>)}</nav></header>}
function Hero(){const[current,setCurrent]=useState(0),[paused,setPaused]=useState(false),startX=useRef(null);const select=index=>{setCurrent((index+heroBanners.length)%heroBanners.length);setPaused(true)};useEffect(()=>{if(paused)return undefined;const timer=setInterval(()=>setCurrent(i=>(i+1)%heroBanners.length),1500);return()=>clearInterval(timer)},[paused]);const slide=heroBanners[current];const end=e=>{if(startX.current===null)return;const delta=e.changedTouches[0].clientX-startX.current;if(Math.abs(delta)>45)select(current+(delta>0?-1:1));startX.current=null};return <section id="home" className="hero" onTouchStart={e=>{startX.current=e.touches[0].clientX;setPaused(true)}} onTouchEnd={end}><div className="hero-art"><picture><source media="(max-width:660px)" srcSet={slide.mobileImage}/><img src={slide.desktopImage} alt={`${slide.title} Shri Harish Crackers, Valliyur`}/></picture></div><div className="hero-content" key={slide.id}><h1>Shri Harish Crackers, Valliyur</h1><p className="eyebrow">{slide.eyebrow}</p><h2 className="hero-title">{slide.title}</h2><p>{slide.description}</p><button className="button primary" onClick={()=>scrollToId(slide.buttonLink)}>{slide.buttonText}<ArrowRight size={18}/></button></div><div className="hero-controls"><button aria-label="Previous slide" onClick={()=>select(current-1)}><ChevronLeft/></button><div className="hero-dots">{heroBanners.map((item,index)=><button aria-label={`Show slide ${index+1}`} className={index===current?'active':''} key={item.id} onClick={()=>select(index)}/>)}</div><button aria-label="Next slide" onClick={()=>select(current+1)}><ChevronRight/></button></div><p className="hero-note">Swipe to explore</p></section>}
function PriceBits({product}){const show=Number(product.originalPrice)>Number(product.price)&&product.discount>0;return <><strong>{money.format(product.price)}</strong>{show&&<s>{money.format(product.originalPrice)}</s>}{show&&<em>{product.discount}% off</em>}</>}
function ProductCard({product,quantity,onOpen,onAdd}){return <article className="product-card"><button className="product-main" onClick={()=>onOpen(product)} aria-label={`View ${product.name} details`}><div className="product-photo">{product.badge?<span>{product.badge}</span>:null}<img src={product.image} alt={product.name} loading="lazy" onError={event=>{if(event.currentTarget.dataset.fallback)return;event.currentTarget.dataset.fallback='1';event.currentTarget.src='/image.png'}}/></div><div className="product-info">{product.category?<p>{product.category}</p>:null}<h3>{product.name}</h3><div className="price"><PriceBits product={product}/></div></div></button><div className="card-actions">{quantity?<span className="in-basket"><Check size={15}/>{quantity} in cart</span>:<button type="button" className="view-details" onClick={()=>onOpen(product)}>View details</button>}<button onClick={()=>onAdd(product)} aria-label={`Add ${product.name} to cart`}><ShoppingBag size={15}/>Add to Cart</button></div></article>}
function Offers({products,notice,cart,onOpen,onAdd}){const body=notice?<p className="catalog-empty" role={notice.startsWith('Loading')?'status':'alert'}>{notice}</p>:products.length?<div className="product-grid">{products.map(product=><ProductCard key={product.id} product={product} quantity={cart[product.id]?.quantity||0} onOpen={onOpen} onAdd={onAdd}/>)}</div>:<p className="catalog-empty">No products are available right now.</p>;return <section id="offers" className="offers"><div className="section-head"><div><p className="eyebrow"><Flame size={14}/>Combo offers</p><h2>Celebrate more.<br/><em>Spend better.</em></h2></div><p>Shri Harish Crackers in Valliyur offers Diwali crackers and festive combos. Pick your favourites, then send an enquiry.</p></div>{body}</section>}
function ProductModal({product,onClose,onAdd,onBuy}){const[quantity,setQuantity]=useState(1);if(!product)return null;return <div className="modal-layer" role="dialog" aria-modal="true" aria-label={`${product.name} details`}><div className="modal-backdrop" onClick={onClose}/><section className="product-modal"><button className="modal-close" onClick={onClose} aria-label="Close product details"><X/></button><ProductGallery product={product}/><div className="modal-copy">{product.category?<p className="eyebrow">{product.category}</p>:null}<h2>{product.name}</h2><ProductDescription text={product.description}/><div className="modal-price"><PriceBits product={product}/></div>{product.highlights?.length>0&&<ul>{product.highlights.map(item=><li key={item}><Check size={15}/>{item}</li>)}</ul>}<div className="modal-quantity"><span>Quantity</span><div className="stepper"><button onClick={()=>setQuantity(Math.max(1,quantity-1))} aria-label="Decrease quantity"><Minus size={16}/></button><output>{quantity}</output><button onClick={()=>setQuantity(quantity+1)} aria-label="Increase quantity"><Plus size={16}/></button></div></div><div className="modal-actions"><button className="button primary" onClick={()=>onAdd(product,quantity,true)}><ShoppingBag size={17}/>Add to Cart</button><button className="button ghost buy-now" onClick={()=>onBuy(product,quantity)}>Buy Now <MessageCircle size={17}/></button></div></div></section></div>}
function CartDrawer({open,onClose,cart,onUpdate,onClear}){
  const items=Object.values(cart),total=items.reduce((sum,item)=>sum+item.price*item.quantity,0);
  const [step,setStep]=useState('cart'),[name,setName]=useState(''),[phone,setPhone]=useState(''),[address,setAddress]=useState('');
  const [errors,setErrors]=useState({}),[whatsappHref,setWhatsappHref]=useState(''),[saving,setSaving]=useState(false),[orderId,setOrderId]=useState('');
  const order=useCustomerOrder(orderId);
  const backToCart=()=>{setStep('cart');setErrors({});setWhatsappHref('')};
  const startEnquiry=()=>{setStep('details');setErrors({});setWhatsappHref('')};
  const submitEnquiry=async event=>{
    event.preventDefault();
    if(saving)return;
    const cleanName=name.trim(),cleanPhone=phone.trim().replace(/[\s()-]/g,''),cleanAddress=address.trim();
    const nextErrors={};
    if(!cleanName)nextErrors.name='Please enter your full name.';
    if(cleanName.length>120)nextErrors.name='Please enter a shorter name.';
    if(!/^(?:\+91)?[6-9]\d{9}$/.test(cleanPhone))nextErrors.phone='Please enter a valid 10-digit mobile number.';
    setErrors(nextErrors);
    if(Object.keys(nextErrors).length)return;
    setSaving(true);
    try {
      setOrderId(await saveOrder({ customerName: cleanName, phone: cleanPhone, address: cleanAddress, source: 'products', items }));
    } catch (error) {
      setSaving(false);
      setErrors({ form: error.message || 'The order could not be saved. Please try again.' });
      return;
    }
    setSaving(false);

    const message=[
      'Hello Shri Harish Crackers,',
      '',
      'I would like to make an enquiry regarding the following products:',
      '',
      'Customer Details',
      `Name: ${cleanName}`,
      `Phone: ${phone.trim()}`,
      ...(cleanAddress?[`Delivery Address: ${cleanAddress}`]:[]),
      '',
      'Enquiry Items',
      '',
      ...items.flatMap((item,index)=>[
        `${index+1}. ${item.name} × ${item.quantity}`,
        `Price: ${money.format(item.price*item.quantity)}`,
      ]),
      `Estimated Total: ${money.format(total)}`,
      '',
      'Please confirm availability and the next steps.',
      '',
      'Thank you.',
    ].join('\n');
    setWhatsappHref(whatsappUrl(message));
    setErrors({});
  };
  return <div className={`cart-layer ${open?'is-open':''}`} aria-hidden={!open}><div className="cart-backdrop" onClick={onClose}/><aside className={`cart-drawer ${step==='details'?'is-checkout':''}`} aria-label={step==='details'?'Complete your enquiry':'Shopping cart'}>
    <header>{step==='details'?<><button className="checkout-back" type="button" onClick={backToCart}><ChevronLeft size={19}/>Back to Cart</button><button onClick={onClose} aria-label="Close enquiry form"><X/></button></>:<><div><p>Your shopping cart</p><h2>Cart</h2></div><button onClick={onClose} aria-label="Close cart"><X/></button></>}</header>
    {items.length?(step==='details'?<form className="checkout-form" onSubmit={submitEnquiry} noValidate>
      <div className="checkout-scroll">
        <h2 className="checkout-title">Complete Your Enquiry</h2>
        <section className="checkout-summary" aria-label="Your enquiry summary">
          <h3>Your Enquiry</h3>
          {items.map(item=><div className="checkout-summary__item" key={item.id}><span>{item.name} × {item.quantity}</span><strong>{money.format(item.price*item.quantity)}</strong></div>)}
          <div className="checkout-summary__total"><span>Estimated Total</span><strong>{money.format(total)}</strong></div>
        </section>
        <label className="checkout-field">Full Name *
          <input autoComplete="name" name="name" type="text" value={name} onChange={event=>{setName(event.target.value);setErrors(value=>({...value,name:'',form:''}))}} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name?'checkout-name-error':undefined}/>
          {errors.name&&<span className="checkout-error" id="checkout-name-error">{errors.name}</span>}
        </label>
        <label className="checkout-field">Phone Number *
          <input autoComplete="tel" inputMode="tel" name="phone" type="tel" value={phone} onChange={event=>{setPhone(event.target.value);setErrors(value=>({...value,phone:'',form:''}))}} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone?'checkout-phone-error':undefined}/>
          {errors.phone&&<span className="checkout-error" id="checkout-phone-error">{errors.phone}</span>}
        </label>
        <label className="checkout-field">Delivery Address (Optional)
          <textarea autoComplete="street-address" name="address" rows="3" value={address} onChange={event=>setAddress(event.target.value)} placeholder="Enter your delivery address if you would like to provide it"/>
        </label>
      </div>
      <footer className="checkout-footer">
        {errors.form&&<p className="checkout-error" role="alert">{errors.form}</p>}
        <button className="button primary" type="submit" disabled={saving||Boolean(whatsappHref)}>{saving?'Saving…':whatsappHref?'Enquiry saved':'Submit Enquiry'} <MessageCircle size={18}/></button>
        {order.status&&<p className="checkout-ready" role="status">Order status: {orderStatusLabel(order.status)}</p>}
        {order.error&&<p className="checkout-error" role="alert">{order.error}</p>}
        {whatsappHref&&<p className="checkout-ready" role="status">Enquiry saved. Open WhatsApp to review the message and press Send.</p>}
        {whatsappHref&&<a className="checkout-whatsapp-link" href={whatsappHref} target="_blank" rel="noopener noreferrer">Open WhatsApp</a>}
      </footer>
    </form>:<><div className="cart-items">{items.map(item=><div className="cart-item" key={item.id}><img src={item.image} alt=""/><div><h3>{item.name}</h3><p>{money.format(item.price)}</p><div className="stepper"><button onClick={()=>onUpdate(item.id,item.quantity-1)} aria-label={`Remove one ${item.name}`}><Minus size={14}/></button><output>{item.quantity}</output><button onClick={()=>onUpdate(item.id,item.quantity+1)} aria-label={`Add one ${item.name}`}><Plus size={14}/></button></div></div><button className="remove" onClick={()=>onUpdate(item.id,0)} aria-label={`Remove ${item.name}`}><Trash2 size={17}/></button></div>)}</div><footer><div><span>Total</span><strong>{money.format(total)}</strong></div><button className="button primary" onClick={startEnquiry}>Proceed to Checkout <ArrowRight size={18}/></button><button className="continue" onClick={onClose}>Continue Shopping</button><button className="clear" onClick={()=>{onClear();backToCart()}}>Clear cart</button></footer></>):<div className="empty-cart"><ShoppingBag size={35}/><h3>Your cart is waiting</h3><p>Add a few favourites to prepare your enquiry.</p><button className="button ghost" onClick={onClose}>Continue Shopping</button></div>}
  </aside></div>;
}
function Toast({message}){return message?<div className="toast">{message}</div>:null}
function About(){return <section id="about" className="about"><div className="about-art"><img src="/image.png" alt="Shri Harish Crackers brand mark"/><p>Celebrations,<br/><b>carried forward.</b></p></div><div className="about-copy"><p className="eyebrow"><HeartHandshake size={14}/>About us</p><h2>Trust is at the heart of every <em>celebration.</em></h2><p>Shri Harish Crackers – Valliyur was established in 2024, carrying forward the trusted legacy of Kannan Sweets, Valliyur, established in 1967.</p><p>For over five decades, Kannan Sweets has been serving generations of customers with a commitment to quality, taste, trust, and customer satisfaction. Building on this rich heritage, we started Shri Harish Crackers to bring the same values of quality and reliability to your festive celebrations.</p><div className="values"><span>Quality</span><span>Trust</span><span>Value</span><span>Celebration</span></div></div><div className="legacy"><p className="eyebrow">Our legacy</p><div><b>1967</b><span><strong>Kannan Sweets</strong>Serving with Trust</span></div><i>↓</i><div><b>2024</b><span><strong>Shri Harish Crackers</strong>A new chapter of celebration</span></div><blockquote>Our journey may have expanded from sweets to crackers, but our commitment remains the same — quality products, reasonable prices, and customer satisfaction.<br/><strong>A legacy of trust. A celebration of joy.</strong></blockquote></div></section>}
function Contact(){return <section id="contact" className="contact"><div className="contact-head"><p className="eyebrow"><MapPin size={14}/>Visit us in Valliyur</p><h2>Come say <em>hello.</em></h2><p>We are here to help you choose for your next celebration.</p></div><div className="contact-grid"><address><MapPin/><span><small>Visit us</small><strong>Near Rotary Club,<br/>Eruvadi Main Road,<br/>Valliyur – 627117</strong></span></address><div><Phone/><span><small>Call us</small><a href="tel:9443184404">94431 84404</a><a href="tel:9629917375">96299 17375</a></span></div><a href={whatsappUrl()} target="_blank" rel="noreferrer"><MessageCircle/><span><small>WhatsApp</small><strong>Start a conversation</strong></span><ArrowRight size={17}/></a><a className="directions" href={directionsUrl} target="_blank" rel="noreferrer"><MapPin/><span><small>Location</small><strong>Get directions</strong></span><ArrowRight size={17}/></a></div></section>}
function InstagramMark(){return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".5" fill="currentColor"/></svg>}
function Footer(){return <footer className="site-footer"><div><Brand/><p>Premium crackers and thoughtful festive offers for celebrations in Valliyur.</p></div><div><h3>Explore</h3>{[['Home','home','/'],['About Us','about','/#about'],['Offers','offers','/#offers'],['Product List','product-list','/product-list'],['Contact Us','contact','/#contact']].map(([label,id,href])=><a key={id} href={href} onClick={event=>{event.preventDefault();goSection(id)}}>{label}</a>)}</div><div><h3>Contact</h3><a href="tel:9443184404">94431 84404</a><a href="tel:9629917375">96299 17375</a><p>Near Rotary Club, Eruvadi Main Road,<br/>Valliyur – 627117</p></div><div className="footer-cta"><p>Need help choosing?</p><a href={whatsappUrl()} target="_blank" rel="noreferrer">WhatsApp us <ArrowRight size={16}/></a><a href={directionsUrl} target="_blank" rel="noreferrer">Get directions <MapPin size={16}/></a><a className="footer-social-link" href="https://www.instagram.com/shri_harish_crackers_valliyur" target="_blank" rel="noopener noreferrer" aria-label="Visit Shri Harish Crackers on Instagram"><InstagramMark/>Instagram</a></div><small>© 2026 Shri Harish Crackers. All rights reserved.</small></footer>}
function BottomNav({count,onCart,current}){const links=[['Home','home',House],['Offers','offers',Tag],['List','product-list',List],['Cart',null,ShoppingBag],['About','about',Info],['Contact','contact',Phone]];return <nav className={`bottom-nav${current==='product-list'?' has-current':''}`} aria-label="Mobile navigation">{links.map(([name,id,Icon])=>{const active=id==='product-list'?current==='product-list':id==='home'&&current==='home';const label=name==='List'?'Product List':name;if(!id)return <button key={name} aria-label={label} onClick={onCart}><span><Icon size={19}/>{count>0&&<b>{count}</b>}</span>{name}</button>;return <a key={name} href={id==='product-list'?'/product-list':id==='home'?'/':`/#${id}`} className={active?'is-current':''} aria-current={active?'page':undefined} aria-label={label} onClick={event=>{event.preventDefault();goSection(id)}}><span><Icon size={19}/></span>{name}</a>})}</nav>}
function InstagramGlyph(){return <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2zm4.5 4.7A5.3 5.3 0 1 0 17.3 12 5.3 5.3 0 0 0 12 6.7zm6.4-1.2a1.25 1.25 0 1 0 1.25 1.25A1.25 1.25 0 0 0 18.4 5.5zM12 8.8A3.2 3.2 0 1 1 8.8 12 3.2 3.2 0 0 1 12 8.8z"/></svg>}
function WhatsAppGlyph(){return <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.04 2C6.58 2 2.15 6.4 2.15 11.83c0 1.74.46 3.44 1.34 4.94L2 22l5.39-1.41a10 10 0 0 0 4.65 1.18h.01c5.46 0 9.89-4.4 9.89-9.83C21.94 6.4 17.5 2 12.04 2zm0 17.95h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.2.84.86-3.12-.2-.32a8.1 8.1 0 0 1-1.25-4.34c0-4.5 3.7-8.16 8.25-8.16 2.2 0 4.27.85 5.83 2.4a8.1 8.1 0 0 1 2.42 5.76c0 4.5-3.7 8.17-8.22 8.17zm4.52-6.11c-.25-.12-1.47-.72-1.7-.8-.23-.09-.39-.12-.56.12-.16.25-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.77-1.84-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.43.06-.66.31-.23.25-.87.85-.87 2.07s.89 2.4 1.01 2.56c.12.16 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.14-1.18-.06-.1-.23-.16-.48-.28z"/></svg>}
function FloatingContacts(){
  const whatsappHref=`https://wa.me/919629917375?text=${encodeURIComponent('Hello Shri Harish Crackers, I would like to know more about your crackers and offers.')}`;
  return <div className="float-contacts" role="group" aria-label="Contact Shri Harish Crackers">
    <a className="is-instagram" href="https://www.instagram.com/shri_harish_crackers_valliyur" target="_blank" rel="noopener noreferrer" aria-label="Visit Shri Harish Crackers on Instagram" title="Instagram"><InstagramGlyph/></a>
    <a className="is-whatsapp" href={whatsappHref} target="_blank" rel="noopener noreferrer" aria-label="Chat with Shri Harish Crackers on WhatsApp" title="WhatsApp"><WhatsAppGlyph/></a>
    <a className="is-call" href="tel:9629917375" aria-label="Call Shri Harish Crackers at 94431 84404" title="Call"><Phone size={22}/></a>
  </div>;
}
export default function App(){
  const path=usePathname();
  const catalog=usePublicCatalog('products');
  const[cart,setCart]=useState(()=>{try{return JSON.parse(localStorage.getItem('shc-cart'))||{}}catch{return {}}});
  const[cartOpen,setCartOpen]=useState(false),[selected,setSelected]=useState(null),[toast,setToast]=useState(''),[bump,setBump]=useState(false);
  useEffect(()=>localStorage.setItem('shc-cart',JSON.stringify(cart)),[cart]);
  const [trackedPath,setTrackedPath]=useState(path);
  if(trackedPath!==path){
    setTrackedPath(path);
    if(path!=='/')setSelected(null);
  }
  useEffect(()=>{
    applyPageMeta(path);
  },[path]);
  const visibleProducts=useMemo(()=>catalog.items.filter(item=>item.active!==false),[catalog.items]);
  const catalogNotice=catalog.loading?'Loading products…':catalog.error||'';
  const openProduct=selected?visibleProducts.find(item=>item.id===selected.id)||null:null;
  if(selected&&!catalog.loading&&!openProduct)setSelected(null);
  const count=useMemo(()=>Object.values(cart).reduce((sum,item)=>sum+item.quantity,0),[cart]);
  const notify=text=>{setToast(text);setBump(true);setTimeout(()=>setToast(''),1700);setTimeout(()=>setBump(false),350)};
  const add=(product,quantity=1,close=false)=>{setCart(value=>({...value,[product.id]:{...product,quantity:(value[product.id]?.quantity||0)+quantity}}));notify(`${product.name} added to cart`);if(close)setSelected(null)};
  const update=(id,quantity)=>setCart(value=>{const next={...value};if(quantity<=0)delete next[id];else next[id]={...next[id],quantity};return next});
  const buy=(product,quantity)=>window.open(whatsappUrl(`Hello Shri Harish Crackers,\n\nI would like to order:\n\nProduct: ${product.name}\nQuantity: ${quantity}\nPrice: ${money.format(product.price)}\nEstimated Total: ${money.format(product.price*quantity)}\n\nPlease confirm availability.\n\nThank you.`),'_blank','noopener,noreferrer');
  const onProductList=path==='/product-list';
  if(path==='/admin')return <Suspense fallback={<main className="admin-loading">Loading admin…</main>}><AdminPage/></Suspense>;
  return <>
    <Navbar count={count} bump={bump} onCart={()=>setCartOpen(true)}/>
    <ImportantNotice/>
    <ExitEnquiry active={path==='/'}/>
    <main>{onProductList?<ProductListPage shopCartOpen={cartOpen} onCloseShopCart={()=>setCartOpen(false)}/>:<><Hero/><Offers products={visibleProducts} notice={catalogNotice} cart={cart} onOpen={setSelected} onAdd={add}/><About/><Contact/></>}</main>
    <Footer/>
    {!onProductList&&<ProductModal key={openProduct?.id||'product-modal'} product={openProduct} onClose={()=>setSelected(null)} onAdd={add} onBuy={buy}/>}
    <CartDrawer open={cartOpen} onClose={()=>setCartOpen(false)} cart={cart} onUpdate={update} onClear={()=>setCart({})}/>
    <Toast message={toast}/>
    <FloatingContacts/>
    <BottomNav count={count} onCart={()=>setCartOpen(true)} current={onProductList?'product-list':'home'}/>
    <Analytics/>
  </>;
}
