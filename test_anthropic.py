import os
import anthropic

# Usar la misma API key que configuramos en settings.py
api_key = os.getenv('ANTHROPIC_API_KEY')

def test_anthropic():
    print("Iniciando prueba de la API de Anthropic...")
    try:
        # Inicializar el cliente
        client = anthropic.Anthropic(
            api_key=api_key
        )
        
        # Crear un prompt de prueba
        prompt = """GENERATE TAGS IN ENGLISH. 
Generate 3-5 thematic tags for this quote.
Respond ONLY with the tags separated by commas.

Quote: "The greatest glory in living lies not in never falling, but in rising every time we fall."
Tags:"""
        
        # Realizar la solicitud
        message = client.messages.create(
            model="claude-3-7-sonnet-20250219",
            max_tokens=100,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        # Mostrar respuesta
        print("\nRespuesta de Claude:")
        print("-" * 40)
        print(message.content[0].text)
        print("-" * 40)
        
        return True
        
    except Exception as e:
        print(f"\nERROR: {str(e)}")
        print(f"Tipo de error: {type(e)}")
        return False

if __name__ == "__main__":
    test_anthropic() 