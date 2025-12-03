from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait 
from selenium.webdriver.support import expected_conditions as EC 
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
import time 

# -------------------------
# CONFIGURATION
# -------------------------
BASE_URL = "http://localhost:4173"

# Setup Headless Chrome Options
chrome_options = Options()
chrome_options.add_argument("--headless")
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--disable-dev-shm-usage")
chrome_options.add_argument("--window-size=1920,1080")

service = Service()
driver = webdriver.Chrome(service=service, options=chrome_options)

# Define the global wait object
WAIT_TIMEOUT = 10 
wait = WebDriverWait(driver, WAIT_TIMEOUT)

unique_test_email = "" # Global variable to hold the unique email used in signup

# --------------------------------------
# GLOBAL LOCATORS (CONFIRMED & REFINED)
# --------------------------------------
DASHBOARD_CONFIRMATION_LOCATOR = (By.XPATH, "//div[contains(text(), 'PFBMS')]")
LOGOUT_BUTTON_LOCATOR = (By.XPATH, "//button[contains(text(), 'Logout')]")
# REFINED LOCATOR: Targets the button with type='submit' AND the text 'Add Expense'
SUBMIT_BUTTON_LOCATOR = (By.XPATH, "//button[@type='submit' and contains(text(), 'Add Expense')]")

# --------------------------------------
# FUNCTION: SIGNUP
# --------------------------------------
def signup():
    """Navigates to the signup page, fills the form, and submits with robust checks."""
    global unique_test_email 
    print("\n--- STEP 1: Starting Signup ---")
    driver.get(BASE_URL + "/signup")
    
    # Locate email field and fill
    email_field_locator = (By.CSS_SELECTOR, "input[type='email']")
    email_field = wait.until(EC.visibility_of_element_located(email_field_locator))
    
    # 1. GENERATE AND FILL UNIQUE EMAIL (Fix for StaleElementReferenceException)
    generated_email = f"testuser_{time.time()}@example.com"
    email_field.send_keys(generated_email) 
    unique_test_email = generated_email # Assign the local variable to the global BEFORE click
    print(f"DEBUG: Email field filled with unique ID: {unique_test_email}")
    
    # Locate and fill password fields
    password_fields_locator = (By.CSS_SELECTOR, "input[type='password']")
    password_fields = wait.until(EC.visibility_of_all_elements_located(password_fields_locator))
    password_fields[0].send_keys("P@ssw0rd1")
    password_fields[1].send_keys("P@ssw0rd1")
    print("DEBUG: Password fields filled.")

    submit_btn_locator = (By.CSS_SELECTOR, "button[type='submit']")
    wait.until(EC.element_to_be_clickable(submit_btn_locator)).click()
    print("DEBUG: Signup button clicked. Checking for Success or Error...")
    
    # Define locator for the error message element
    error_locator = (By.XPATH, "//div[@class='text-red-400 text-sm']") 

    try:
        # SUCCESS condition: Wait for the URL to change to the base URL (/) due to auto-login
        WebDriverWait(driver, 5).until(EC.url_to_be(BASE_URL + "/"))
        # CONFIRMATION WAIT: Wait for the PFBMS app title element
        wait.until(EC.presence_of_element_located(DASHBOARD_CONFIRMATION_LOCATOR)) 
        print("✅ Signup completed. Auto-logged in and redirected to /.")
        
    except Exception:
        # If success fails, check for the error message (FAILURE condition)
        try:
            error_element = WebDriverWait(driver, 5).until(EC.visibility_of_element_located(error_locator))
            error_message = error_element.text
            raise Exception(f"Signup failed on the client side. **API/Client Error:** {error_message}")
        
        except Exception as e:
            # If neither success nor a client error message is found, the original Timeout stands
            raise Exception(f"Signup failed: Timed out waiting for redirect, and no client-side error was displayed. Check backend logs. Original error: {e}")

# --------------------------------------
# FUNCTION: LOGOUT
# --------------------------------------
def logout():
    """Finds and clicks the logout button, waiting for the redirect to /login."""
    print("\n--- STEP 1B: Logging Out ---")
    
    # 1. Wait for the PFBMS app title to confirm the root page is ready.
    wait.until(EC.presence_of_element_located(DASHBOARD_CONFIRMATION_LOCATOR), 
              "Timed out waiting for 'PFBMS' app title to appear before logging out.")
    print("DEBUG: Dashboard confirmed loaded by finding 'PFBMS' title.")
    
    # 2. Locate and click the confirmed Logout button
    wait.until(EC.element_to_be_clickable(LOGOUT_BUTTON_LOCATOR)).click()
    print("DEBUG: Logout button clicked. Waiting for /login redirect...")
    
    # 3. Wait for the successful redirect back to the login page
    wait.until(EC.url_contains("/login"))
    print("✅ Logout completed. Redirected to /login.")

# --------------------------------------
# FUNCTION: LOGIN
# --------------------------------------
def login():
    """Navigates to the login page, enters credentials, and submits."""
    print("\n--- STEP 2: Starting Login Test ---")
    driver.get(BASE_URL + "/login")
    
    # Wait for the Email field
    email_field_locator = (By.CSS_SELECTOR, "input[type='email']")
    email_field = wait.until(EC.visibility_of_element_located(email_field_locator))
    email_field.send_keys(unique_test_email)
    
    # Locate and fill the Password field
    driver.find_element(By.CSS_SELECTOR, "input[type='password']").send_keys("P@ssw0rd1")
    print("DEBUG: Login credentials filled.")
    
    # Wait for and click the Login button
    submit_btn_locator = (By.CSS_SELECTOR, "button[type='submit']")
    wait.until(EC.element_to_be_clickable(submit_btn_locator)).click()
    print("DEBUG: Login button clicked. Waiting for root page (/) to load...")
    
    # CRITICAL WAIT: Wait for the URL to change to the base URL (/)
    wait.until(EC.url_to_be(BASE_URL + "/"), "Timed out waiting for redirect to root URL (/) after login.")
    
    # CONFIRMATION WAIT: Wait for the PFBMS app title element again.
    wait.until(EC.presence_of_element_located(DASHBOARD_CONFIRMATION_LOCATOR))
    
    print("🔑 Login completed. Root page (dashboard) loaded.")

# --------------------------------------
# FUNCTION: CREATE TRANSACTION 
# --------------------------------------
def create_transaction():
    """Navigates to the expenses page, fills the expense form using precise locators, and creates a transaction."""
    print("\n--- STEP 3: Starting Create Transaction ---")
    driver.get(BASE_URL + "/expenses")
    
    # 1. Ensure the "Expense" tab is active and wait for form visibility
    expense_tab_btn_locator = (By.XPATH, "//button[contains(text(), 'Expense')]")
    wait.until(EC.element_to_be_clickable(expense_tab_btn_locator)).click()
    print("DEBUG: Expense tab activated.")
    
    # 2. Wait for the form to be ready by checking for the submit button
    wait.until(EC.presence_of_element_located(SUBMIT_BUTTON_LOCATOR))
    print("DEBUG: Expense form submit button confirmed present.")
    
    # --- FILLING EXPENSE FORM FIELDS using specific locators ---
    
    # 1. Name (Placeholder="Name")
    name_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Name']")))
    name_input.send_keys("Test Grocery Shopping") 
    
    # 2. Amount (Placeholder="Amount")
    amount_input = driver.find_element(By.XPATH, "//input[@placeholder='Amount']")
    amount_input.send_keys("50.75")
    
    # 3. Date (The first input[type='date'])
    date_input = driver.find_element(By.XPATH, "//input[@type='date']")
    date_input.send_keys("2025-12-02")
    
    print("DEBUG: Expense form fields filled (Name, Amount, Date).")
    
    # 4. Click the Save/Submit button using the highly specific locator
    wait.until(EC.element_to_be_clickable(SUBMIT_BUTTON_LOCATOR)).click()
    
    print("💰 Transaction added successfully.")

# -------------------------
# RUN TESTS
# -------------------------

if __name__ == "__main__":
    try:
        # 1. Create User (Auto-logs in)
        signup()
        
        # 2. Logout (Required to set up the login test scenario)
        logout()
        
        # 3. Log In (Test the actual login process)
        login()
        
        # 4. Create Transaction
        create_transaction()
        
        print("\n*** All test steps completed successfully! ***")
        
    except Exception as e:
        print(f"\n❌ FAILED TEST SCENARIO ❌")
        print(f"Error Type: {type(e).__name__}")
        print(f"Details: {e}")
        
    finally:
        # Final pause for debugging output readability, then quit
        time.sleep(1) 
        driver.quit()
        print("DEBUG: Browser session closed.")