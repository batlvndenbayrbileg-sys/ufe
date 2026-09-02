# 17 — Example Mongolian Content (lessons, tasks, hints, tests, student experience)

Everything below is production-intent copy, not placeholder. It is the reference an author copies
the *shape* of.

---

## 17.1 Full lesson — `m1-l5` · "Бүтээгдэхүүний карт хийцгээе"

### Lesson header (rendered above the task stepper)

> ### Бүтээгдэхүүний карт хийцгээе
> **Юу бүтээх вэ:** Shop.mn-ийн нүүр хуудсан дээр харагдах бүтээгдэхүүний карт.
>
> **Яагаад?**
> Shop.mn дээр 100 бүтээгдэхүүн байлаа гэж бодъё. Тэд бүгд ижилхэн хэлбэртэй жижиг "карт" дотор
> харагдана. Тиймээс эхлээд **нэг** картыг маш сайн хийж сурах хэрэгтэй. Дараа нь түүнийгээ олон
> удаа давтаж, бүх дэлгүүрээ дүүргэнэ.
>
> **Юу сурах вэ:** `<article>`, `<img>`, `<button>`, `class`, элементийн бүтэц
> **Хугацаа:** ~28 минут · **4 даалгавар**

### Concept block (before task 1)

> #### Карт гэж юу вэ?
>
> Онлайн дэлгүүр бүр бүтээгдэхүүнээ ижилхэн хэлбэрээр харуулдаг. Тэр хэлбэрийг **карт** гэж нэрлэдэг.
>
> Нэг картад дор хаяж дөрвөн зүйл байна:
>
> ```
> ┌─────────────────┐
> │                 │  ← 1. зураг
> │     [зураг]     │
> │                 │
> ├─────────────────┤
> │ Хантааз          │  ← 2. нэр
> │ ₮ 129,000       │  ← 3. үнэ
> │ [Сагсанд хийх]  │  ← 4. товч
> └─────────────────┘
> ```
>
> HTML-ээр бид эдгээрийг **нэг элемент дотор** багцална. Ингэснээр дараа нь бүх картыг нэг дор
> загварчлах боломжтой болно.

---

### Даалгавар 1 / 4 — Картын араг ясыг үүсгэ

> `index.html` файлын `<main>` дотор шинэ `<article>` элемент нэм.
> Түүнд `product-card` гэсэн class өг.
>
> Файл дотор `<!-- энд бичнэ үү -->` гэсэн тэмдэглэгээ байгаа. Тэр байрлалд бич.

**Шаардлага**
- [ ] `<article>` элемент байна
- [ ] `class="product-card"` байна
- [ ] `<main>` дотор байрлана

**Хүлээгдэж буй үр дүн**
> Preview дээр одоохондоо юу ч харагдахгүй — энэ хэвийн. `<article>` бол хоосон хайрцаг.
> Дараагийн даалгавраас эхлээд дотор нь агуулга нэмнэ.

**Шалгалт**
```json
[
  { "id": "c1", "type": "dom.exists",
    "args": { "selector": "main article.product-card", "min": 1 },
    "onFail": { "mn": "`product-card` class-тай `<article>` элемент `<main>` дотроос олдсонгүй. Class-ийн бичлэгээ шалгаарай — дунд нь зураас (-) байгаа эсэх." } },
  { "id": "c2", "type": "html.valid",
    "args": {},
    "onFail": { "mn": "HTML бүтцэд алдаа байна. Нээсэн tag бүрээ хаасан эсэхээ шалгаарай: `<article>` … `</article>`." } }
]
```

**Заавар**
1. *(0 XP)* `<article>` бол бие даасан нэг агуулгыг илэрхийлдэг элемент. Түүнийг `<main>`-ийн **дотор** бичнэ.
2. *(−1 XP)* Элементэд class өгөхдөө нээлттэй tag дотор `class="..."` гэж бичдэг. Жишээ нь `<div class="box">`.
3. *(−3 XP)* Ингэж эхэлнэ:
   ```html
   <article class="product-card">
     <!-- дараагийн даалгавраас агуулга нэмнэ -->
   </article>
   ```

**Хариулт** *(4 XP)*
```html
<main>
  <article class="product-card">
  </article>
</main>
```
> `<article>` нь бусад агуулгаас тусад нь утга агуулах хэсгийг заана. Бүтээгдэхүүний карт нь өөрөө
> бие даан ойлгогдох тул `<div>`-ээс илүү тохиромжтой. Хожим хайлтын систем (Google) ч үүнийг
> ойлгодог.

---

### Даалгавар 2 / 4 — Зураг нэм

> Картын дотор бүтээгдэхүүний зураг нэм.
> Зургийн зам: `images/deel.jpg`
> `alt` шинжид бүтээгдэхүүний нэрийг бич: `Монгол дээл`

**Шаардлага**
- [ ] `<img>` элемент карт дотор байна
- [ ] `src="images/deel.jpg"`
- [ ] `alt` хоосон биш

**Хүлээгдэж буй үр дүн**
> Preview дээр дээлний зураг гарч ирнэ. Одоохондоо том, эмх замбараагүй харагдана — CSS-ээр
> дараа засна.

**Шалгалт**
```json
[
  { "id": "c1", "type": "dom.exists",
    "args": { "selector": "article.product-card img", "min": 1 },
    "onFail": { "mn": "Картын дотор `<img>` элемент олдсонгүй. `<article>` … `</article>`-ийн ХООРОНД бичсэн эсэхээ шалгаарай." } },
  { "id": "c2", "type": "dom.attr",
    "args": { "selector": "article.product-card img", "name": "src", "equals": "images/deel.jpg" },
    "onFail": { "mn": "Зургийн зам таарахгүй байна. `src=\"images/deel.jpg\"` гэж яг ингэж бичнэ. Файлын нэр жижиг үсгээр." } },
  { "id": "c3", "type": "dom.attr",
    "args": { "selector": "article.product-card img", "name": "alt", "minLength": 3 },
    "onFail": { "mn": "`alt` хоосон байна. `alt` нь зураг ачаалагдаагүй үед харагдах текст, мөн хараагүй хүмүүсийн уншигч программ үүнийг уншдаг. Хоосон орхиж болохгүй." } }
]
```

**Заавар**
1. Зураг оруулах tag нь `<img>`. Энэ tag хаагдахгүй — өөрөө хаагдана: `<img ... />`.
2. `<img>`-д хоёр чухал шинж хэрэгтэй: зураг хаана байгааг заах `src`, зургийг үгээр тайлбарлах `alt`.
3. Бүтэц нь ийм байна: `<img src="ЗАМ" alt="ТАЙЛБАР">`

---

### Даалгавар 3 / 4 — Нэр ба үнэ

> Зургийн доор бүтээгдэхүүний нэр, үнийг нэм.
> - Нэр: `Монгол дээл` — `<h3>` дотор
> - Үнэ: `₮ 129,000` — `<p>` дотор, `class="price"` өг

**Хүлээгдэж буй үр дүн**
> Зургийн доор "Монгол дээл" гэсэн гарчиг, түүний доор "₮ 129,000" гэсэн үнэ харагдана.

**Шалгалт**
```json
[
  { "id": "c1", "type": "dom.text",
    "args": { "selector": "article.product-card h3", "contains": "Монгол дээл", "trim": true },
    "onFail": { "mn": "`<h3>` дотроос \"Монгол дээл\" гэсэн текст олдсонгүй." } },
  { "id": "c2", "type": "dom.exists",
    "args": { "selector": "article.product-card p.price" },
    "onFail": { "mn": "`price` class-тай `<p>` олдсонгүй. `<p class=\"price\">` гэж бичнэ." } },
  { "id": "c3", "type": "dom.text",
    "args": { "selector": "article.product-card p.price", "matches": "₮\\s?129[,\\s]?000" },
    "onFail": { "mn": "Үнэ дээр `₮` тэмдэгт байх ёстой. Жишээ нь: `₮ 129,000`. Тэмдэгтийг хуулж авч болно: ₮" } },
  { "id": "c4", "type": "dom.order",
    "args": { "selectors": ["article.product-card img", "article.product-card h3", "article.product-card p.price"] },
    "onFail": { "mn": "Дараалал буруу байна. Эхлээд зураг, дараа нь нэр, дараа нь үнэ байх ёстой." } }
]
```

> **Author note:** `c3` uses a regex, not equality, so `₮129,000`, `₮ 129,000` and `₮ 129 000` all
> pass. Rejecting a student for a space is exactly the false-fail that loses accounts.

---

### Даалгавар 4 / 4 — "Сагсанд хийх" товч

> Картын хамгийн доор товч нэм.
> - Текст: `Сагсанд хийх`
> - `class="btn-add"`
> - `data-testid="add-to-cart"` — энэ шинжийг заавал нэм. Дараагийн хичээлүүдэд JavaScript энэ
>   товчийг олохын тулд ашиглана.

**Хүлээгдэж буй үр дүн**
> Үнийн доор "Сагсанд хийх" гэсэн товч харагдана. Дарахад одоохондоо юу ч болохгүй — тэр нь дараагийн модулийн ажил.

**Шалгалт**
```json
[
  { "id": "c1", "type": "dom.exists",
    "args": { "selector": "article.product-card button[data-testid='add-to-cart']" },
    "onFail": { "mn": "`data-testid=\"add-to-cart\"` шинжтэй `<button>` олдсонгүй. Энэ шинж чухал — дараагийн хичээлд хэрэгтэй болно." } },
  { "id": "c2", "type": "dom.text",
    "args": { "selector": "article.product-card button", "contains": "Сагсанд хийх", "trim": true },
    "onFail": { "mn": "Товчны текст \"Сагсанд хийх\" байх ёстой." } },
  { "id": "c3", "type": "dom.attr",
    "args": { "selector": "article.product-card button", "name": "class", "contains": "btn-add" },
    "onFail": { "mn": "Товчид `btn-add` class өгөөгүй байна." } },
  { "id": "c4", "type": "dom.a11y",
    "args": { "rules": ["image-alt", "button-name"] },
    "onFail": { "mn": "Хүртээмжийн шалгалт давсангүй. Товч дотор текст байх ёстой, зурагт `alt` байх ёстой." } }
]
```

### Lesson completion screen

> ## 🎉 Чи анхны бүтээгдэхүүний картаа бүтээлээ.
> Одоо чиний Shop.mn дээр жинхэнэ бүтээгдэхүүн байна.
> Дараагийн хичээлд энэ картыг **6 удаа** давтаж, бүтэн дэлгүүр болгоно.
>
> **+55 XP** · HTML 42% → 51%
> **[ Дараагийн хичээл: Бүтээгдэхүүний жагсаалт → ]**

### Reference solution (full)

```html
<main>
  <article class="product-card">
    <img src="images/deel.jpg" alt="Монгол дээл">
    <h3>Монгол дээл</h3>
    <p class="price">₮ 129,000</p>
    <button class="btn-add" data-testid="add-to-cart">Сагсанд хийх</button>
  </article>
</main>
```

### Known-bad fixtures (CI must fail each with a *distinct* message)

| Fixture | Mistake | Must trigger |
|---|---|---|
| `bad-1` | `<div class="product-card">` instead of `<article>` | t1/c1 |
| `bad-2` | `<img src="images/Deel.jpg">` (capital D) | t2/c2 |
| `bad-3` | `alt=""` | t2/c3 |
| `bad-4` | price written as `129000` | t3/c3 |
| `bad-5` | button before price | t3/c4 |
| `bad-6` | `<button>` outside the `<article>` | t4/c1 |

---

## 17.2 Example task with behavioural tests — `m5-l2-t2` (JavaScript)

### Даалгавар — "Сагсанд нэмэх"

> `js/cart.js` дотор `addToCart(product)` функцийг бич.
>
> Функц юу хийх вэ:
> 1. `cart` массивт тухайн бүтээгдэхүүн **аль хэдийн байгаа эсэхийг** шалгана.
> 2. Байвал → түүний `quantity`-г 1-ээр нэмнэ.
> 3. Байхгүй бол → `{ ...product, quantity: 1 }` гэж массивт нэмнэ.
> 4. Дараа нь `updateCartCount()`-ийг дуудна.
>
> **Анхаар:** нэг бүтээгдэхүүнийг 2 удаа дарахад сагсанд **2 өөр мөр** болох ёсгүй.

**Шалгалт**
```json
[
  { "id": "c1", "type": "ast.declares",
    "args": { "file": "js/cart.js", "kind": "function", "name": "addToCart" },
    "onFail": { "mn": "`addToCart` нэртэй функц олдсонгүй. Нэрийг яг ингэж бичнэ." } },

  { "id": "c2", "type": "js.evaluate",
    "args": { "setup": "cart = []; addToCart({id:1,name:'Дээл',price:129000});",
              "expr": "cart.length", "equals": 1 },
    "onFail": { "mn": "Нэг удаа нэмэхэд сагсанд 1 мөр байх ёстой. Одоо {actual} байна." } },

  { "id": "c3", "type": "js.evaluate",
    "args": { "setup": "cart = []; addToCart({id:1,name:'Дээл',price:129000}); addToCart({id:1,name:'Дээл',price:129000});",
              "expr": "cart.length", "equals": 1 },
    "onFail": { "mn": "Ижил бүтээгдэхүүнийг 2 удаа нэмэхэд сагсанд 2 мөр болсон байна. Эхлээд `find`-аар байгаа эсэхийг шалгах хэрэгтэй." } },

  { "id": "c4", "type": "js.evaluate",
    "args": { "setup": "cart = []; addToCart({id:1}); addToCart({id:1});",
              "expr": "cart[0].quantity", "equals": 2 },
    "onFail": { "mn": "`quantity` 2 болох ёстой байсан, одоо {actual} байна. Байгаа мөрийн `quantity`-г нэмж байгаа эсэхээ шалгаарай." } },

  { "id": "c5", "type": "js.interaction",
    "args": { "steps": [
      { "click": "[data-testid='add-to-cart']" },
      { "expectText": { "selector": "[data-testid='cart-count']", "equals": "1" } },
      { "click": "[data-testid='add-to-cart']" },
      { "expectText": { "selector": "[data-testid='cart-count']", "equals": "2" } }
    ]},
    "onFail": { "mn": "Товч дарахад дэлгэц дээрх сагсны тоо өөрчлөгдөхгүй байна. `updateCartCount()`-ийг дуудсан эсэхээ шалгаарай." } },

  { "id": "c6", "type": "js.consoleClean", "args": {},
    "onFail": { "mn": "Console дээр алдаа гарч байна. Preview доорх Console хэсгийг нээж хараарай." } }
]
```

**Заавар**
1. Массиваас ямар нэг зүйлийг олохын тулд `find()` ашигладаг. Юугаар нь харьцуулах вэ? — `id`-гаар.
2. `const existing = cart.find(item => item.id === product.id)` — `existing` олдвол утга, олдохгүй бол `undefined` байна.
3. ```js
   const existing = cart.find(item => item.id === product.id);
   if (existing) {
     // энд quantity нэм
   } else {
     // энд массивт шинээр нэм
   }
   ```

**Хариулт**
```js
export function addToCart(product) {
  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  updateCartCount();
}
```
> `find()` нь массиваас эхний тохирох элементийг буцаана, олдохгүй бол `undefined`. `undefined` нь
> `if`-д "худал" гэж тооцогддог тул `if (existing)` гэж шууд бичиж болно.
> `{ ...product, quantity: 1 }` нь `product`-ийн бүх талбарыг хуулж аваад, дээр нь `quantity` нэмнэ.

---

## 17.3 Example API task — `m8-l5-t3` (backend)

> ### Даалгавар — Шинэ бүтээгдэхүүн нэмэх endpoint
>
> `app/api/products/route.ts` дотор `POST` функц бич.
>
> - Body-оос `name`, `price`, `categoryId` авна.
> - Хэрэв `name` хоосон эсвэл `price` тоо биш бол → **400** буцаана,
>   `{ "error": { "message": "..." } }` хэлбэртэй.
> - Зөв бол шинэ бүтээгдэхүүнийг нэмээд → **201**, үүссэн объектыг `id`-тэй нь буцаана.

```json
[
  { "id": "c1", "type": "http.request",
    "args": { "method": "POST", "path": "/api/products",
      "body": { "name": "Малгай", "price": 45000, "categoryId": 1 },
      "expect": { "status": 201, "jsonPath": { "$.name": "Малгай", "$.id": { "exists": true } } } },
    "onFail": { "mn": "Зөв өгөгдөл илгээхэд 201 статус, `id`-тэй объект буцаах ёстой." } },

  { "id": "c2", "type": "http.request",
    "args": { "method": "POST", "path": "/api/products", "body": { "price": 45000 },
      "expect": { "status": 400 } },
    "onFail": { "mn": "`name` байхгүй үед 400 буцаах ёстой. Одоо {actual} буцаалаа. Validation-аа шалгаарай." } },

  { "id": "c3", "type": "http.request",
    "args": { "method": "POST", "path": "/api/products",
      "body": { "name": "Малгай", "price": "үнэгүй" }, "expect": { "status": 400 } },
    "onFail": { "mn": "`price` тоо биш үед 400 буцаах ёстой. Хэрэглэгчээс ирсэн өгөгдөлд хэзээ ч бүү итгэ." } },

  { "id": "c4", "type": "http.sequence",
    "args": { "requests": [
      { "method": "POST", "path": "/api/products", "body": { "name": "Тест", "price": 1000, "categoryId": 1 },
        "capture": { "id": "$.id" } },
      { "method": "GET", "path": "/api/products/$id", "expect": { "status": 200, "jsonPath": { "$.name": "Тест" } } }
    ]},
    "onFail": { "mn": "Нэмсэн бүтээгдэхүүнээ дахин уншиж чадсангүй. Өгөгдлөө үнэхээр хадгалж байна уу?" } }
]
```

---

## 17.4 Example SQL task — `m9-l6-t2` (PGlite, in the browser)

> ### Даалгавар — Бүтээгдэхүүнийг ангиллынх нь нэртэй хамт гаргах
>
> `products` болон `categories` хүснэгтийг холбож, дараах баганатай үр дүн гарга:
> `product_name`, `price_mnt`, `category_name`.
> Зөвхөн `is_active = true` бүтээгдэхүүнийг ав. Үнээр буурахаар эрэмбэл.

```json
[
  { "id": "c1", "type": "sql.resultEquals",
    "args": { "expectFromReference": true, "orderSensitive": true,
      "referenceQuery": "select p.name as product_name, p.price_mnt, c.name as category_name from products p join categories c on c.id = p.category_id where p.is_active = true order by p.price_mnt desc" },
    "onFail": { "mn": "Үр дүн таарахгүй байна. Багануудын нэр (`product_name`, `category_name`), шүүлтүүр (`is_active`), эрэмбэ (буурахаар) гурвыг шалгаарай." } },
  { "id": "c2", "type": "sql.usesFeature",
    "args": { "feature": "join" },
    "onFail": { "mn": "Энэ даалгаварт `JOIN` ашиглах ёстой. Хоёр хүснэгтийг тусад нь уншаад код дотор нийлүүлж болохгүй." } }
]
```

**Заавар**
1. Хоёр хүснэгтийг холбохын тулд ямар багана нийтлэг вэ? — `products.category_id` ба `categories.id`.
2. `join categories c on c.id = p.category_id`
3. Багананд шинэ нэр өгөхийн тулд `as` ашиглана: `p.name as product_name`.

---

## 17.5 Example AI tutor conversation (the target quality bar)

> **Оюутан:** ажиллахгүй байна. сагсны тоо өөрчлөгдөхгүй байна
>
> **🤖 Багш:**
> **Ажиглалт** — `addToCart` функц чинь зөв бичигдсэн байна, `cart` массив ч зөв нэмэгдэж байна.
>
> **Асуудал** — Дэлгэц дээрх тоо шинэчлэгдэхгүй байгаа нь өөр газар байна.
>
> **Асуулт** — `updateCartCount()` функц чинь дуудагдаж байна уу? `addToCart`-ийн доод талд нэмсэн эсэхээ хараарай.
>
> **Дараагийн алхам** — `cart.js:14` мөрөнд `console.log('нэмэгдлээ', cart.length)` тавиад товчоо дараад Console-оо хараарай.
>
> ---
>
> **Оюутан:** console дээр "нэмэгдлээ 1" гарч байна. гэхдээ дэлгэц дээр 0 хэвээр
>
> **🤖 Багш:**
> Сайн байна — функц ажиллаж байгаа нь тодорхой боллоо. Тэгвэл асуудал нь **DOM руу бичих** хэсэгт байна.
>
> **Асуулт** — `updateCartCount()` дотор ямар элементийг сонгож байна вэ? Тэр selector чинь HTML дээрх
> элементтэй яг таарч байна уу?
>
> **Зөвлөмж** — Preview дээр баруун товшоод элементийг шалгаад `data-testid` нь юу байгааг хараарай.
> HTML дээр `cart-count`, JS дээр `cartCount` гэж бичсэн бол таарахгүй.

Note what the tutor did **not** do: it did not write `document.querySelector(...)`. Two turns, zero
code, and the student found it themselves. That is the bar.

---

## 17.6 Example student experience — Ануужин, first session (23 minutes)

```
20:14  Opens khiye.mn from a friend's Facebook link.
       Hero has live code. She changes "Сайн уу" to her name. The preview updates.
       → 11 seconds in, she has already written code.
20:15  "Үнэгүй эхлэх" → Google signup, 20 s.
20:16  Placement: 5 questions. "HTML бичиж үзсэн үү?" → "Сургууль дээр бага зэрэг."
       → entry point m1-l1 (skips M0, offered as optional).
20:17  Goal: "Ажилд орох". Hours: 10/week.
       → "Энэ хурдаар 2026 оны 11-р сарын 20-нд Shop.mn-ээ дуусгана."
20:18  Sees the finished Shop.mn she will build. Scrolls it. It's real.
20:19  [ Эхлэх ] → /learn/m1-l1
       Три panes. Left: task. Middle: index.html with 3 lines. Right: blank preview.
20:20  Task 1: add <h1>Shop.mn</h1>. She types it. The preview shows it as she types.
       → the "oh" moment.
20:21  [ ✓ Шалгах ] → 180 ms → ✅ "Чи анхны вэб хуудсаа бичлээ." +10 XP
       Celebration overlay, once. Next task unlocks.
20:23  Task 2: a paragraph. Passes first try.
20:26  Task 3: она forgets the closing tag. Check c2 fails:
       "HTML бүтцэд алдаа байна. Нээсэн tag бүрээ хаасан эсэхээ шалгаарай."
       She finds it in 40 seconds. Passes. → first recovery, unassisted. This is the moment
       the product actually works.
20:31  Lesson 1 complete. +15 XP. HTML skill 0% → 8%. Streak day 1.
20:32  Lesson 2 auto-opens. She keeps going.
20:37  Finishes lesson 2. Dashboard shows 2/142 lessons, 78 XP, Level 2.
       "Маргааш үргэлжлүүлэх" reminder offered → she enables it.
```

Two things in this transcript are the whole product: **the preview updating as she types**, and
**recovering from a failure on her own in 40 seconds**. Everything in this blueprint exists to
protect those two moments.

---

## 17.7 Copy library (reusable strings)

| Situation | Mongolian |
|---|---|
| Pass, small | `Болсон. +10 XP` |
| Pass, lesson | `Хичээл дууслаа. Одоо чи {skill} ашиглаж чадна.` |
| Pass, milestone | `Чи Shop.mn-ийнхээ {feature}-ийг өөрөө бүтээлээ.` |
| Fail, generic | `Одоохондоо болоогүй байна. Доорх шалгалтуудыг хараарай.` |
| Fail, close | `Бараг боллоо. {n} шалгалт үлдлээ.` |
| Runtime error header | `Юу болов?` / `Хаана?` / `Яагаад?` / `Яаж өөрөө олох вэ?` |
| Infinite loop | `Таны код хязгааргүй давталтад орлоо. `for` эсвэл `while`-ийн зогсох нөхцөлөө шалгаарай.` |
| Timeout (server) | `Хугацаа дууслаа. Таны буруу биш байж магадгүй — дахин оролдоно уу.` |
| Locked lesson | `Өмнөх хичээлээ дуусгаад энд ирээрэй.` |
| Solution locked | `Хариултыг харахын тулд: {n} удаа оролдох, {m} заавар үзэх шаардлагатай.` |
| Streak broken | `Дараалал шинээр эхэллээ. Өнөөдөр нэг даалгавар хийвэл дахин эхэлнэ.` |
| Returning after a break | `Тавтай морил. Хамгийн сүүлд "{lesson}" дээр зогссон байна.` |
| AI quota reached | `Өнөөдрийн AI хязгаарт хүрлээ. Заавар болон Console чинь хэвээрээ байна.` |
| Offline | `Интернэт тасарлаа. Кодоо үргэлжлүүлэн бичиж болно — холбогдоход автоматаар хадгална.` |
| Empty dashboard | `Эхлэх цаг боллоо. Эхний даалгавар 90 секунд авна.` |

---

*Next: [18 — Build Tickets](18-build-tickets.md)*
