// ===================== CONFIG =====================
const SPOONACULAR_KEY = 'a71616ea95fc41a993bdaf11ad96b995';
const SPOONACULAR_BASE = 'https://api.spoonacular.com';
 
// ===================== STATE =====================
let favourites = JSON.parse(localStorage.getItem('chefFavourites')) || [];
let planner = JSON.parse(localStorage.getItem('chefPlanner')) || {};
let currentPlannerDay = '';
let currentModalIngredients = [];
 
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
 
    fetch(`${SPOONACULAR_BASE}/recipes/complexSearch?query=${encodeURIComponent(query)}&number=12&addRecipeInformation=true&apiKey=${SPOONACULAR_KEY}`)
        .then(r => r.json())
        .then(data => {
            grid.innerHTML = '';
            if (data.results && data.results.length > 0) {
                data.results.forEach(m => grid.appendChild(createCard(m)));
            } else {
                err.style.display = 'block';
            }
        })
        .catch(() => {
            grid.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center">Search failed. Please try again.</p>';
        });
}
 
// ===================== CATEGORIES =====================
document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadCategory(btn.dataset.cat);
    });
});
 
// MealDB cuisine map fallback
const mealDBMap = {
    'Indian': 'Indian', 'Chinese': 'Chinese', 'Italian': 'Italian',
    'Mexican': 'Mexican', 'Japanese': 'Japanese', 'French': 'French',
    'Thai': 'Thai', 'American': 'American', 'Mediterranean': 'Greek',
    'Middle Eastern': 'Moroccan'
};
 
function loadCategory(cuisine) {
    const grid = document.getElementById('category-results');
    grid.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
 
    fetch(`${SPOONACULAR_BASE}/recipes/complexSearch?cuisine=${encodeURIComponent(cuisine)}&number=12&addRecipeInformation=true&apiKey=${SPOONACULAR_KEY}`)
        .then(r => r.json())
        .then(data => {
            grid.innerHTML = '';
            if (data.results && data.results.length > 0) {
                data.results.forEach(m => grid.appendChild(createCard(m)));
            } else {
                // Fallback to MealDB
                loadCategoryFallback(cuisine, grid);
            }
        })
        .catch(() => loadCategoryFallback(cuisine, grid));
}
 
function loadCategoryFallback(cuisine, grid) {
    const mealDBCuisine = mealDBMap[cuisine] || 'Indian';
    fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?a=${mealDBCuisine}`)
        .then(r => r.json())
        .then(data => {
            grid.innerHTML = '';
            if (data.meals) {
                data.meals.slice(0, 12).forEach(m => grid.appendChild(createCard(m)));
            } else {
                grid.innerHTML = `<p style="color:var(--text-muted);grid-column:1/-1">No recipes found. Try another category!</p>`;
            }
        })
        .catch(() => {
            grid.innerHTML = `<p style="color:var(--text-muted);grid-column:1/-1;text-align:center">Could not load recipes. Please try again.</p>`;
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
 
    const ingredientList = fridgeIngredients.join(',');
    fetch(`${SPOONACULAR_BASE}/recipes/findByIngredients?ingredients=${encodeURIComponent(ingredientList)}&number=12&ranking=1&apiKey=${SPOONACULAR_KEY}`)
        .then(r => r.json())
        .then(data => {
            grid.innerHTML = '';
            if (data && data.length > 0) {
                data.forEach(m => grid.appendChild(createCard(m)));
            } else {
                // No results — show AI generator
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
                    content: `You are an expert Indian and global cuisine chef. Create a delicious recipe using these available ingredients: ${ingredients}. 
                    
                    You can suggest 2-3 common pantry items (salt, oil, spices etc) that most people have.
                    
                    Respond ONLY with a JSON object in this exact format, no markdown, no extra text:
                    {
                        "name": "Recipe Name",
                        "cuisine": "Indian/Italian/etc",
                        "time": "30 minutes",
                        "servings": "2-3",
                        "extraIngredients": ["salt", "oil"],
                        "ingredients": ["2 cups rice", "1 onion chopped"],
                        "steps": ["Step 1 here", "Step 2 here"],
                        "tip": "A helpful cooking tip"
                    }`
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
                ${recipe.extraIngredients.length ? `
                <div class="ai-recipe-section">
                    <h5>🛒 You'll also need</h5>
                    <div class="ai-extra-ingredients">
                        ${recipe.extraIngredients.map(i => `<span class="fridge-tag">${i}</span>`).join('')}
                    </div>
                </div>` : ''}
                <div class="ai-recipe-section">
                    <h5>🧂 Ingredients</h5>
                    <ul class="ai-ingredient-list">
                        ${recipe.ingredients.map(i => `<li>${i}</li>`).join('')}
                    </ul>
                </div>
                <div class="ai-recipe-section">
                    <h5>👩‍🍳 Instructions</h5>
                    <ol class="ai-steps-list">
                        ${recipe.steps.map(s => `<li>${s}</li>`).join('')}
                    </ol>
                </div>
                ${recipe.tip ? `
                <div class="ai-tip">
                    <span>💡</span> <strong>Chef's Tip:</strong> ${recipe.tip}
                </div>` : ''}
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
    fetch(`${SPOONACULAR_BASE}/recipes/complexSearch?query=${encodeURIComponent(q)}&number=6&addRecipeInformation=true&apiKey=${SPOONACULAR_KEY}`)
        .then(r => r.json())
        .then(data => {
            list.innerHTML = '';
            if (data.results && data.results.length > 0) {
                data.results.forEach(meal => {
                    const item = document.createElement('div');
                    item.className = 'planner-result-item';
                    item.innerHTML = `<img src="${meal.image}" alt="${meal.title}"><span>${meal.title}</span><button onclick="assignMeal('${meal.id}','${meal.title.replace(/'/g,"\\'")}','${meal.image}')">Add</button>`;
                    list.appendChild(item);
                });
            } else {
                list.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:1rem">No results found.</p>';
            }
        });
}
document.getElementById('planner-search-input').addEventListener('keyup', e => { if (e.key === 'Enter') searchForPlanner(); });
 
function assignMeal(id, name, thumb) {
    planner[currentPlannerDay] = { id, name, thumb };
    localStorage.setItem('chefPlanner', JSON.stringify(planner));
    bootstrap.Modal.getInstance(document.getElementById('plannerModal')).hide();
    const slot = document.querySelector(`.meal-slot[data-day="${currentPlannerDay}"]`);
    slot.innerHTML = `<img src="${thumb}" alt="${name}"><p>${name}</p><button class="remove-meal-btn" onclick="event.stopPropagation();removeMeal('${currentPlannerDay}')"><i class="fas fa-times"></i></button>`;
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
    const idx = favourites.findIndex(f => f.id === meal.id);
    if (idx === -1) favourites.push(meal); else favourites.splice(idx, 1);
    localStorage.setItem('chefFavourites', JSON.stringify(favourites));
    renderFavourites();
    document.querySelectorAll(`.heart-btn[data-id="${meal.id}"]`).forEach(btn => {
        btn.classList.toggle('active', favourites.some(f => f.id === meal.id));
    });
}
 
function renderFavourites() {
    // Clean out any old MealDB favourites (they have idMeal instead of id)
    favourites = favourites.filter(f => f.id && f.title && f.title !== 'undefined');
    localStorage.setItem('chefFavourites', JSON.stringify(favourites));
 
    const grid = document.getElementById('favourites-grid');
    grid.innerHTML = '';
    if (favourites.length === 0) {
        const p = document.createElement('p');
        p.className = 'empty-fav';
        p.textContent = 'No favourites yet! Tap the ❤️ on any recipe to save it here.';
        grid.appendChild(p);
    } else {
        favourites.forEach(m => {
            const card = createCard(m);
            if (card.innerHTML) grid.appendChild(card);
        });
    }
}
 
function handleHeart(e, mealId) {
    e.stopPropagation();
    const existing = favourites.find(f => String(f.id) === String(mealId));
    if (existing) {
        toggleFavourite(existing);
    } else {
        fetch(`${SPOONACULAR_BASE}/recipes/${mealId}/information?apiKey=${SPOONACULAR_KEY}`)
            .then(r => r.json())
            .then(data => toggleFavourite(data));
    }
}
 
// ===================== CARDS =====================
function createCard(meal) {
    const id = meal.id || meal.idMeal;
    const title = meal.title || meal.strMeal;
    const image = meal.image || meal.strMealThumb;
    const cuisine = meal.cuisines && meal.cuisines.length ? meal.cuisines[0] : (meal.strCategory || '');
 
    // Skip cards with missing data
    if (!id || !title || title === 'undefined') return document.createElement('div');
 
    const isFav = favourites.some(f => String(f.id) === String(id));
 
    const div = document.createElement('div');
    div.className = 'recipe-card';
    div.innerHTML = `
        <div class="card-img-wrap">
            ${image && image !== 'undefined'
                ? `<img src="${image}" alt="${title}" loading="lazy" onerror="this.parentElement.style.background='#f5e6d3';this.style.display='none'">`
                : `<div style="height:195px;background:linear-gradient(135deg,#f5c5a3,#ffd166);display:flex;align-items:center;justify-content:center;font-size:3rem;">🍛</div>`
            }
            <button class="heart-btn ${isFav ? 'active' : ''}" data-id="${id}" onclick="handleHeart(event,'${id}')">
                <i class="fas fa-heart"></i>
            </button>
        </div>
        <div class="card-body-inner">
            <h5>${title}</h5>
            ${cuisine ? `<span class="meal-cat">${cuisine}</span>` : ''}
            <button class="view-btn" onclick="displayDetails('${id}')">View Recipe</button>
        </div>`;
    return div;
}
 
// ===================== RECIPE DETAIL + INLINE SCALER =====================
function displayDetails(mealId) {
    const detailDiv = document.getElementById('foodsDetails');
    detailDiv.innerHTML = '<div class="loading-spinner py-5"><i class="fas fa-spinner fa-spin fa-2x"></i></div>';
    new bootstrap.Modal(document.getElementById('recipeModal')).show();
 
    fetch(`${SPOONACULAR_BASE}/recipes/${mealId}/information?apiKey=${SPOONACULAR_KEY}`)
        .then(r => r.json())
        .then(food => {
            const isFav = favourites.some(f => String(f.id) === String(food.id));
 
            currentModalIngredients = food.extendedIngredients || [];
 
            const ingredientsHTML = currentModalIngredients.map(ing =>
                `<li><span class="ing-measure">${ing.measures?.metric?.amount ? ing.measures.metric.amount.toFixed(1) + ' ' + ing.measures.metric.unitShort : ''}</span> ${ing.name}</li>`
            ).join('');
 
            const instructions = food.instructions
                ? food.instructions.replace(/<[^>]*>/g, '')
                : (food.analyzedInstructions?.[0]?.steps?.map(s => s.step).join('\n\n') || 'No instructions available.');
 
            const cuisineTag = food.cuisines?.length ? food.cuisines[0] : '';
            const dietTags = food.diets?.slice(0, 2).map(d => `<span class="tag">🥗 ${d}</span>`).join('') || '';
 
            detailDiv.innerHTML = `
                <div class="detail-header">
                    <img src="${food.image}" alt="${food.title}" class="detail-img">
                    <div class="detail-info">
                        <h3>${food.title}</h3>
                        <div class="detail-tags">
                            ${cuisineTag ? `<span class="tag">🌍 ${cuisineTag}</span>` : ''}
                            ${food.dishTypes?.length ? `<span class="tag">🍽️ ${food.dishTypes[0]}</span>` : ''}
                            ${dietTags}
                            ${food.readyInMinutes ? `<span class="tag">⏱️ ${food.readyInMinutes} min</span>` : ''}
                            ${food.servings ? `<span class="tag">👥 ${food.servings} servings</span>` : ''}
                        </div>
                        <button class="heart-btn lg ${isFav ? 'active' : ''}" data-id="${food.id}" onclick="handleHeart(event,'${food.id}')">
                            <i class="fas fa-heart"></i> ${isFav ? 'Saved!' : 'Save Recipe'}
                        </button>
                        ${food.sourceUrl ? `<br><a href="${food.sourceUrl}" target="_blank" class="yt-btn"><i class="fas fa-external-link-alt"></i> Full Recipe</a>` : ''}
                    </div>
                </div>
                <div class="detail-body">
                    <div class="detail-section">
                        <h5>🧂 Ingredients</h5>
                        <ul class="ingredient-list" id="modal-ingredient-list">${ingredientsHTML}</ul>
                        <div class="modal-scaler">
                            <h6>⚖️ Scale this Recipe</h6>
                            <div class="scaler-row">
                                <label>Servings:</label>
                                <input type="number" id="modal-servings" min="1" value="${food.servings || 2}">
                                <button onclick="scaleModalIngredients(${food.servings || 2})">Scale</button>
                            </div>
                            <div id="scaled-result"></div>
                        </div>
                    </div>
                    <div class="detail-section">
                        <h5>👩‍🍳 Instructions</h5>
                        <p class="instructions-text">${instructions}</p>
                    </div>
                </div>`;
        })
        .catch(() => {
            detailDiv.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:2rem">Could not load recipe details. Please try again.</p>';
        });
}
 
function scaleModalIngredients(originalServings) {
    const servings = parseFloat(document.getElementById('modal-servings').value);
    if (!servings || servings <= 0) return;
    const result = document.getElementById('scaled-result');
    result.innerHTML = '';
    const ratio = servings / (originalServings || 2);
    currentModalIngredients.forEach(ing => {
        const amt = ing.measures?.metric?.amount;
        const unit = ing.measures?.metric?.unitShort || '';
        const scaled = amt ? (amt * ratio).toFixed(1) : '—';
        const div = document.createElement('div');
        div.className = 'scaled-item';
        div.textContent = `${scaled} ${unit} — ${ing.name}`;
        result.appendChild(div);
    });
}
 
// ===================== INIT =====================
renderFavourites();
renderPlanner();
