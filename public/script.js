document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('task-input')
    const addTaskBtn = document.getElementById('add-task-btn')
    const taskList = document.getElementById('task-list')
    const emptyImage = document.querySelector('.empty-img')
    const todosContainer = document.querySelector('.todos-container')
    const progressBar = document.getElementById('progress')
    const progressNumbers = document.getElementById('numbers')

    const toggleEmptyState = () => {
        emptyImage.style.display = taskList.children.length === 0 ? 'block' : 'none'
        todosContainer.style.width = taskList.children.length > 0 ? '100%' : '50%'
    }

    const updateProgress = (checkCompletion = true) => {
        const totalTasks = taskList.children.length
        const completedTasks = taskList.querySelectorAll('.checkbox:checked').length

        progressBar.style.width = totalTasks ? `${(completedTasks / totalTasks) * 100}%` : '0%'
        progressNumbers.textContent = `${completedTasks} / ${totalTasks}`

        if(checkCompletion && totalTasks > 0 && completedTasks === totalTasks){
            Confetti()
        }
    }

    // Fetch tasks from server
    const fetchTasks = async () => {
        try {
            // Clear existing tasks before fetching
            taskList.innerHTML = '';

            const response = await fetch('/api/tasks');
            const tasks = await response.json();
            tasks.forEach(task => addTask(task.text, task.completed, false, task.id));
            toggleEmptyState();
            updateProgress();
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    }

    const addTask = async (text, completed = false, checkCompletion = true, existingId = null) => {
        const taskText = text || taskInput.value.trim()
        if (!taskText) {
            return
        }

        try {
            // Only send to server if it's a new task
            let taskId = existingId;
            if (!existingId) {
                const response = await fetch('/api/tasks', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ text: taskText, completed })
                });
                const { id } = await response.json();
                taskId = id;
            }

            const li = document.createElement('li')
            li.dataset.id = taskId  // Store server ID
            li.innerHTML = `
            <input type="checkbox" class="checkbox" ${completed ? 'checked' : ''}/>
            <span>${taskText}</span>
            <div class="task-btns"> 
                <button class="edit-btn"><i class="fa-solid fa-pen"></i></button>
                <button class="delete-btn"><i class="fa-solid fa-trash"></i></button>
            </div>
            `

            const checkbox = li.querySelector('.checkbox')
            const editBtn = li.querySelector('.edit-btn')

            if (completed) {
                li.classList.add('completed')
                editBtn.disabled = true
                editBtn.style.opacity = '0.5'
                editBtn.style.pointerEvents = 'none'
            }

            checkbox.addEventListener('change', async () => {
                const isChecked = checkbox.checked;
                li.classList.toggle('completed', isChecked)
                editBtn.disabled = isChecked
                editBtn.style.opacity = isChecked ? '0.05' : '1'
                editBtn.style.pointerEvents = isChecked ? 'none' : 'auto'
                
                // Update task completion on server
                await fetch(`/api/tasks/${li.dataset.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ completed: isChecked })
                });

                updateProgress()
            })

            editBtn.addEventListener('click', async () => {
                if (!checkbox.checked) {
                    taskInput.value = li.querySelector('span').textContent
                    
                    // Delete task from server
                    await fetch(`/api/tasks/${li.dataset.id}`, {
                        method: 'DELETE'
                    });

                    li.remove()
                    toggleEmptyState()
                    updateProgress(false)
                }
            })

            li.querySelector('.delete-btn').addEventListener('click', async () => {
                // Delete task from server
                await fetch(`/api/tasks/${li.dataset.id}`, {
                    method: 'DELETE'
                });

                li.remove()
                toggleEmptyState()
                updateProgress()
            })

            // Only append if not already exists
            if (!existingId) {
                taskList.appendChild(li)
                taskInput.value = ''
            } else {
                // For existing tasks from database
                taskList.appendChild(li)
            }

            toggleEmptyState()
            updateProgress(checkCompletion)
        } catch (error) {
            console.error('Error adding task:', error);
        }
    }

    addTaskBtn.addEventListener('click', () => addTask())
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            addTask()
        }
    })

    // Fetch existing tasks on load
    fetchTasks()
})

// Confetti function remains the same (from previous implementation)
const Confetti = () => {
    const duration = 15 * 1000,
        animationEnd = Date.now() + duration,
        defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        // since particles fall down, start a bit higher than random
        confetti(
            Object.assign({}, defaults, {
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            })
        );
        confetti(
            Object.assign({}, defaults, {
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            })
        );
    }, 250);
}