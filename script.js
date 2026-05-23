// ===================== STATE =====================
let favourites = JSON.parse(localStorage.getItem('chefFavourites')) || [];
let planner = JSON.parse(localStorage.getItem('chefPlanner')) || {};
let currentPlannerDay = '';
let currentModalIngredients = [];
 
// Clean out old incompatible favourites
favourites = favourites.filter(f => (f.idMeal || f.id) && (f.strMeal || f.title));
localStorage.setItem('chefFavourites', JSON.stringify(favourites));
 
// ===================== HELPERS =====================
function getMealId(m) { return m.idMeal || m.id; }
function getMealTitle(m) { return m.strMeal || m.title; }
function getMealThumb(m) { return m.strMealThumb || m.image || ''; }
function getMealCategory(m) { return m.strCategory || (m.cuisines && m.cuisines[0]) || ''; }
 
// ===================== SEARCH =====================
document.getElementById('search-button').addEventListener('click', () => {
    const val = document.getElementById('input-box').value.trim();
    if (val) searchRecipes(val);
});
document.getElementById('input-box').addEventListener('keyup', e => {
    if (e.key === 'Enter') {
        const val = document.getElementById('input-box').value.trim();
        if (val) searchRecipes(val);
    }
});
 
function searchRecipes(query) {
    const section = document.getElementById('results-section');
    const grid = document.getElementById('fooditem');
    const err = document.getElementById('error-message');
    section.style.display = 'block';
    section.scrollIntoView({ behavior: 'smooth' });
    grid.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Searching...</div>';
    err.style.display = 'none';
 
    fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`)
        .then(r => r.json())
        .then(data => {
            grid.innerHTML = '';
            if (data.meals && data.meals.length > 0) {
                data.meals.forEach(m => grid.appendChild(createCard(m)));
            } else {
                err.style.display = 'block';
            }
        })
        .catch(() => {
            grid.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center">Search failed. Please try again.</p>';
        });
}
 
// ===================== CATEGORIES =====================
// MealDB uses "area" for cuisine and "category" for food type
const categoryMap = {
    'Indian': { type: 'area', value: 'Indian' },
    'Chinese': { type: 'area', value: 'Chinese' },
    'Thai': { type: 'area', value: 'Thai' },
    'Mediterranean': { type: 'area', value: 'Greek' },
    'Italian': { type: 'area', value: 'Italian' },
    'Mexican': { type: 'area', value: 'Mexican' },
    'Japanese': { type: 'area', value: 'Japanese' },
    'Middle Eastern': { type: 'area', value: 'Moroccan' },
    'American': { type: 'area', value: 'American' },
    'French': { type: 'area', value: 'French' }
};
 
document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadCategory(btn.dataset.cat);
    });
});
 
function loadCategory(cuisine) {
    const grid = document.getElementById('category-results');
    grid.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
 
    const map = categoryMap[cuisine] || { type: 'area', value: cuisine };
    const url = map.type === 'area'
        ? `https://www.themealdb.com/api/json/v1/1/filter.php?a=${map.value}`
        : `https://www.themealdb.com/api/json/v1/1/filter.php?c=${map.value}`;
 
    fetch(url)
        .then(r => r.json())
        .then(data => {
            grid.innerHTML = '';
            if (data.meals && data.meals.length > 0) {
                data.meals.slice(0, 12).forEach(m => grid.appendChild(createCard(m)));
            } else {
                grid.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1">No recipes found in this category.</p>';
            }
        })
        .catch(() => {
            grid.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center">Could not load. Please try again.</p>';
        });
}
loadCategory('Indian');
 
// ===================== FRIDGE =====================
let fridgeIngredients = [];
 
document.getElementById('fridge-btn').addEventListener('click', () => {
    const val = document.getElementById('fridge-input').value.trim();
    if (val) {
        val.split(',').forEach(i => {
            const c = i.trim();
            if (c && !fridgeIngredients.includes(c)) fridgeIngredients.push(c);
        });
        document.getElementById('fridge-input').value = '';
        renderFridgeTags();
        searchByIngredients();
    }
});
document.getElementById('fridge-input').addEventListener('keyup', e => {
    if (e.key === 'Enter') document.getElementById('fridge-btn').click();
});
 
function renderFridgeTags() {
    const c = document.getElementById('fridge-tags');
    c.innerHTML = '';
    fridgeIngredients.forEach((ing, i) => {
        const tag = document.createElement('span');
        tag.className = 'fridge-tag';
        tag.innerHTML = `${ing} <i class="fas fa-times" onclick="removeIngredient(${i})"></i>`;
        c.appendChild(tag);
    });
}
 
function removeIngredient(i) {
    fridgeIngredients.splice(i, 1);
    renderFridgeTags();
    if (fridgeIngredients.length > 0) searchByIngredients();
    else document.getElementById('fridge-results').innerHTML = '';
}
 
function searchByIngredients() {
    const grid = document.getElementById('fridge-results');
    grid.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Finding recipes...</div>';
 
    fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(fridgeIngredients[0])}`)
        .then(r => r.json())
        .then(data => {
            grid.innerHTML = '';
            if (data.meals && data.meals.length > 0) {
                data.meals.slice(0, 12).forEach(m => grid.appendChild(createCard(m)));
            } else {
                showAIGenerator(grid);
            }
        })
        .catch(() => showAIGenerator(grid));
}
 
// ===================== AI RECIPE GENERATOR =====================
function showAIGenerator(grid) {
    grid.innerHTML = `
        <div class="ai-generator-box">
            <div class="ai-generator-header">
                <span class="ai-icon">✨</span>
                <div>
                    <h4>No exact matches found!</h4>
                    <p>But our AI Chef can create a custom recipe with what you have.</p>
                </div>
            </div>
            <button class="ai-generate-btn" onclick="generateAIRecipe()">
                <i class="fas fa-magic"></i> Generate AI Recipe for "${fridgeIngredients.join(', ')}"
            </button>
            <div id="ai-recipe-result"></div>
        </div>`;
}
 
async function generateAIRecipe() {
    const resultDiv = document.getElementById('ai-recipe-result');
    const btn = document.querySelector('.ai-generate-btn');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Chef AI is cooking...';
    btn.disabled = true;
 
    const ingredients = fridgeIngredients.join(', ');
 
    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1000,
                messages: [{
                    role: 'user',
                    content: `You are an expert Indian and global cuisine chef. Create a delicious recipe using these available ingredients: ${ingredients}. You can suggest 2-3 common pantry items (salt, oil, spices) that most people have. Respond ONLY with a JSON object, no markdown, no extra text:
{"name":"Recipe Name","cuisine":"Indian/etc","time":"30 minutes","servings":"2-3","extraIngredients":["salt","oil"],"ingredients":["2 cups rice","1 onion chopped"],"steps":["Step 1","Step 2"],"tip":"A helpful tip"}`
                }]
            })
        });
 
        const data = await response.json();
        const text = data.content[0].text.trim();
        const recipe = JSON.parse(text);
 
        resultDiv.innerHTML = `
            <div class="ai-recipe-card">
                <div class="ai-recipe-title">
                    <h3>🍳 ${recipe.name}</h3>
                    <div class="ai-recipe-meta">
                        <span>🌍 ${recipe.cuisine}</span>
                        <span>⏱️ ${recipe.time}</span>
                        <span>👥 ${recipe.servings} servings</span>
                    </div>
                </div>
                ${recipe.extraIngredients && recipe.extraIngredients.length ? `
                <div class="ai-recipe-section">
                    <h5>🛒 You'll also need</h5>
                    <div class="ai-extra-ingredients">${recipe.extraIngredients.map(i => `<span class="fridge-tag">${i}</span>`).join('')}</div>
                </div>` : ''}
                <div class="ai-recipe-section">
                    <h5>🧂 Ingredients</h5>
                    <ul class="ai-ingredient-list">${recipe.ingredients.map(i => `<li>${i}</li>`).join('')}</ul>
                </div>
                <div class="ai-recipe-section">
                    <h5>👩‍🍳 Instructions</h5>
                    <ol class="ai-steps-list">${recipe.steps.map(s => `<li>${s}</li>`).join('')}</ol>
                </div>
                ${recipe.tip ? `<div class="ai-tip"><span>💡</span> <strong>Chef's Tip:</strong> ${recipe.tip}</div>` : ''}
            </div>`;
        btn.innerHTML = '<i class="fas fa-magic"></i> Generate Another Recipe';
        btn.disabled = false;
    } catch (err) {
        resultDiv.innerHTML = '<p style="color:var(--text-muted);margin-top:1rem">Could not generate recipe. Please try again.</p>';
        btn.innerHTML = '<i class="fas fa-magic"></i> Try Again';
        btn.disabled = false;
    }
}
 
// ===================== MEAL PLANNER =====================
function renderPlanner() {
    Object.keys(planner).forEach(day => {
        const slot = document.querySelector(`.meal-slot[data-day="${day}"]`);
        if (slot && planner[day]) {
            slot.innerHTML = `<img src="${planner[day].thumb}" alt="${planner[day].name}"><p>${planner[day].name}</p><button class="remove-meal-btn" onclick="event.stopPropagation();removeMeal('${day}')"><i class="fas fa-times"></i></button>`;
            slot.classList.add('has-meal');
            slot.onclick = null;
        }
    });
}
 
function openPlannerSearch(day) {
    currentPlannerDay = day;
    document.getElementById('plannerModalTitle').textContent = `Add meal for ${day}`;
    document.getElementById('planner-search-results').innerHTML = '';
    document.getElementById('planner-search-input').value = '';
    new bootstrap.Modal(document.getElementById('plannerModal')).show();
}
 
function searchForPlanner() {
    const q = document.getElementById('planner-search-input').value.trim();
    if (!q) return;
    const list = document.getElementById('planner-search-results');
    list.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></div>';
 
    fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(q)}`)
        .then(r => r.json())
        .then(data => {
            list.innerHTML = '';
            if (data.meals && data.meals.length > 0) {
                data.meals.slice(0, 6).forEach(meal => {
                    const item = document.createElement('div');
                    item.className = 'planner-result-item';
                    const safeName = meal.strMeal.replace(/'/g, "\\'");
                    item.innerHTML = `<img src="${meal.strMealThumb}/preview" alt="${meal.strMeal}"><span>${meal.strMeal}</span><button onclick="assignMeal('${meal.idMeal}','${safeName}','${meal.strMealThumb}')">Add</button>`;
                    list.appendChild(item);
                });
            } else {
                list.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:1rem">No results found.</p>';
            }
        })
        .catch(() => {
            list.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:1rem">Search failed. Try again.</p>';
        });
}
document.getElementById('planner-search-input').addEventListener('keyup', e => {
    if (e.key === 'Enter') searchForPlanner();
});
 
function assignMeal(id, name, thumb) {
    planner[currentPlannerDay] = { id, name, thumb };
    localStorage.setItem('chefPlanner', JSON.stringify(planner));
    bootstrap.Modal.getInstance(document.getElementById('plannerModal')).hide();
    const slot = document.querySelector(`.meal-slot[data-day="${currentPlannerDay}"]`);
    slot.innerHTML = `<img src="${thumb}/preview" alt="${name}"><p>${name}</p><button class="remove-meal-btn" onclick="event.stopPropagation();removeMeal('${currentPlannerDay}')"><i class="fas fa-times"></i></button>`;
    slot.classList.add('has-meal');
    slot.onclick = null;
}
 
function removeMeal(day) {
    delete planner[day];
    localStorage.setItem('chefPlanner', JSON.stringify(planner));
    const slot = document.querySelector(`.meal-slot[data-day="${day}"]`);
    slot.innerHTML = `<i class="fas fa-plus"></i><span>Add Meal</span>`;
    slot.classList.remove('has-meal');
    slot.onclick = () => openPlannerSearch(day);
}
 
function clearPlanner() {
    if (!confirm('Clear the whole planner?')) return;
    planner = {};
    localStorage.setItem('chefPlanner', JSON.stringify(planner));
    document.querySelectorAll('.meal-slot').forEach(slot => {
        const day = slot.dataset.day;
        slot.innerHTML = `<i class="fas fa-plus"></i><span>Add Meal</span>`;
        slot.classList.remove('has-meal');
        slot.onclick = () => openPlannerSearch(day);
    });
}
 
// ===================== FAVOURITES =====================
function toggleFavourite(meal) {
    const id = getMealId(meal);
    const idx = favourites.findIndex(f => getMealId(f) === id);
    if (idx === -1) favourites.push(meal); else favourites.splice(idx, 1);
    localStorage.setItem('chefFavourites', JSON.stringify(favourites));
    renderFavourites();
    document.querySelectorAll(`.heart-btn[data-id="${id}"]`).forEach(btn => {
        btn.classList.toggle('active', favourites.some(f => getMealId(f) === id));
    });
}
 
function renderFavourites() {
    const grid = document.getElementById('favourites-grid');
    grid.innerHTML = '';
    if (favourites.length === 0) {
        const p = document.createElement('p');
        p.className = 'empty-fav';
        p.textContent = 'No favourites yet! Tap the ❤️ on any recipe to save it here.';
        grid.appendChild(p);
    } else {
        favourites.forEach(m => grid.appendChild(createCard(m)));
    }
}
 
function handleHeart(e, mealId) {
    e.stopPropagation();
    const existing = favourites.find(f => getMealId(f) === mealId);
    if (existing) {
        toggleFavourite(existing);
    } else {
        fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`)
            .then(r => r.json())
            .then(data => { if (data.meals) toggleFavourite(data.meals[0]); });
    }
}
 
// ===================== CARDS =====================
function createCard(meal) {
    const id = getMealId(meal);
    const title = getMealTitle(meal);
    const image = getMealThumb(meal);
    const category = getMealCategory(meal);
 
    if (!id || !title) return document.createElement('div');
 
    const isFav = favourites.some(f => getMealId(f) === id);
    const div = document.createElement('div');
    div.className = 'recipe-card';
    div.innerHTML = `
        <div class="card-img-wrap">
            ${image
                ? `<img src="${image}" alt="${title}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
                : ''}
            <div style="display:${image ? 'none' : 'flex'};height:195px;background:linear-gradient(135deg,#f5c5a3,#ffd166);align-items:center;justify-content:center;font-size:3rem;">🍛</div>
            <button class="heart-btn ${isFav ? 'active' : ''}" data-id="${id}" onclick="handleHeart(event,'${id}')">
                <i class="fas fa-heart"></i>
            </button>
        </div>
        <div class="card-body-inner">
            <h5>${title}</h5>
            ${category ? `<span class="meal-cat">${category}</span>` : ''}
            <button class="view-btn" onclick="displayDetails('${id}')">View Recipe</button>
        </div>`;
    return div;
}
 
// ===================== RECIPE DETAIL + INLINE SCALER =====================
function displayDetails(mealId) {
    const detailDiv = document.getElementById('foodsDetails');
    detailDiv.innerHTML = '<div class="loading-spinner py-5"><i class="fas fa-spinner fa-spin fa-2x"></i></div>';
    new bootstrap.Modal(document.getElementById('recipeModal')).show();
 
    fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`)
        .then(r => r.json())
        .then(data => {
            const food = data.meals[0];
            const isFav = favourites.some(f => getMealId(f) === food.idMeal);
 
            // Build ingredients
            currentModalIngredients = [];
            let ingredientsHTML = '';
            for (let i = 1; i <= 20; i++) {
                const ing = food[`strIngredient${i}`];
                const measure = food[`strMeasure${i}`];
                if (ing && ing.trim()) {
                    currentModalIngredients.push({ measure: measure || '', name: ing });
                    ingredientsHTML += `<li><span class="ing-measure">${measure || ''}</span> ${ing}</li>`;
                }
            }
 
            detailDiv.innerHTML = `
                <div class="detail-header">
                    <img src="${food.strMealThumb}" alt="${food.strMeal}" class="detail-img">
                    <div class="detail-info">
                        <h3>${food.strMeal}</h3>
                        <div class="detail-tags">
                            ${food.strCategory ? `<span class="tag">🍽️ ${food.strCategory}</span>` : ''}
                            ${food.strArea ? `<span class="tag">🌍 ${food.strArea}</span>` : ''}
                        </div>
                        <button class="heart-btn lg ${isFav ? 'active' : ''}" data-id="${food.idMeal}" onclick="handleHeart(event,'${food.idMeal}')">
                            <i class="fas fa-heart"></i> ${isFav ? 'Saved!' : 'Save Recipe'}
                        </button>
                        ${food.strYoutube ? `<br><a href="${food.strYoutube}" target="_blank" class="yt-btn"><i class="fab fa-youtube"></i> Watch Video</a>` : ''}
                    </div>
                </div>
                <div class="detail-body">
                    <div class="detail-section">
                        <h5>🧂 Ingredients</h5>
                        <ul class="ingredient-list">${ingredientsHTML}</ul>
                        <div class="modal-scaler">
                            <h6>⚖️ Scale this Recipe</h6>
                            <div class="scaler-row">
                                <label>Servings:</label>
                                <input type="number" id="modal-servings" min="1" value="2">
                                <button onclick="scaleModalIngredients()">Scale</button>
                            </div>
                            <div id="scaled-result"></div>
                        </div>
                    </div>
                    <div class="detail-section">
                        <h5>👩‍🍳 Instructions</h5>
                        <p class="instructions-text">${food.strInstructions}</p>
                    </div>
                </div>`;
        })
        .catch(() => {
            detailDiv.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:2rem">Could not load recipe. Please try again.</p>';
        });
}
 
function scaleModalIngredients() {
    const servings = parseFloat(document.getElementById('modal-servings').value);
    if (!servings || servings <= 0) return;
    const result = document.getElementById('scaled-result');
    result.innerHTML = '';
    currentModalIngredients.forEach(ing => {
        const parts = ing.measure.trim().split(' ');
        const qty = parseFloat(parts[0]);
        const unit = isNaN(qty) ? ing.measure : parts.slice(1).join(' ');
        const scaled = isNaN(qty) ? ing.measure : `${(qty * servings).toFixed(qty % 1 === 0 ? 0 : 1)} ${unit}`;
        const div = document.createElement('div');
        div.className = 'scaled-item';
        div.textContent = `${scaled} — ${ing.name}`;
        result.appendChild(div);
    });
}
 
// ===================== INIT =====================
renderFavourites();
renderPlanner();
 
