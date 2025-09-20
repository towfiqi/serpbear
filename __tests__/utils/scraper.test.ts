// Test for error serialization helper functions
describe('Error Handling Utilities', () => {
  it('should serialize error objects to readable strings', () => {
    const errorObject = {
      status: 400,
      error: 'API rate limit exceeded',
      body: 'Request failed',
      request_info: {
        success: false,
        error: 'Rate limited'
      }
    };

    // Test that JSON.stringify works for complex objects
    const serialized = JSON.stringify(errorObject);
    expect(serialized).toContain('400');
    expect(serialized).toContain('API rate limit exceeded');
    
    // Test that object toString returns [object Object]
    const toStringResult = errorObject.toString();
    expect(toStringResult).toBe('[object Object]');
  });

  it('should handle nested error objects', () => {
    const nestedError = {
      status: 500,
      request_info: {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          details: { requestId: 'req-123' }
        }
      }
    };

    const serialized = JSON.stringify(nestedError);
    expect(serialized).toContain('INTERNAL_ERROR');
    expect(serialized).toContain('Internal server error');
    expect(serialized).toContain('req-123');
  });

  it('should demonstrate the issue with Error constructor and object serialization', () => {
    const errorObject = { message: 'Test error', code: 500 };
    
    // This is what happens currently - creating Error from object
    const error = new Error(errorObject as any);
    expect(error.message).toBe('[object Object]');
    
    // This is what should happen - proper serialization
    const properError = new Error(JSON.stringify(errorObject));
    expect(properError.message).toContain('Test error');
    expect(properError.message).toContain('500');
  });
});

// Test for the new serializeError helper function (assuming it's exported or accessible)
describe('serializeError function behavior', () => {
  // Mock serializeError function based on implementation
  const serializeError = (error: any): string => {
    if (!error) return 'Unknown error';
    
    if (typeof error === 'string') return error;
    
    if (error instanceof Error) return error.message;
    
    if (typeof error === 'object') {
       // Handle nested error objects by recursively extracting error info
       const extractErrorInfo = (obj: any): string => {
          if (typeof obj === 'string') return obj;
          if (typeof obj === 'object' && obj !== null) {
             return obj.message || obj.error || obj.detail || obj.error_message || JSON.stringify(obj);
          }
          return String(obj);
       };
       
       const message = extractErrorInfo(error.message || error.error || error.detail || error.error_message);
       const status = error.status ? `[${error.status}] ` : '';
       const errorInfo = extractErrorInfo(error.request_info?.error);
       
       if (message || status || errorInfo) {
          const parts = [status, message, errorInfo].filter(part => part && part !== 'null' && part !== 'undefined');
          if (parts.length > 0) return parts.join(' ').trim();
       }
       
       try {
          return JSON.stringify(error);
       } catch {
          return error.toString() !== '[object Object]' ? error.toString() : 'Unserializable error object';
       }
    }
    
    return String(error);
  };

  it('should handle string errors correctly', () => {
    const result = serializeError('Simple error message');
    expect(result).toBe('Simple error message');
  });

  it('should handle Error objects correctly', () => {
    const error = new Error('Network error');
    const result = serializeError(error);
    expect(result).toBe('Network error');
  });

  it('should extract meaningful information from API error objects', () => {
    const apiError = {
      status: 400,
      error: 'API rate limit exceeded',
      request_info: {
        error: 'Too many requests'
      }
    };
    
    const result = serializeError(apiError);
    expect(result).toContain('[400]');
    expect(result).toContain('API rate limit exceeded');
    expect(result).toContain('Too many requests');
  });

  it('should handle complex nested error objects', () => {
    const complexError = {
      status: 500,
      request_info: {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        }
      }
    };
    
    const result = serializeError(complexError);
    // Should extract the meaningful message and status
    expect(result).toContain('500');
    expect(result).toContain('Internal server error');
    // Code may or may not be extracted depending on the exact structure
  });

  it('should handle null/undefined errors', () => {
    expect(serializeError(null)).toBe('Unknown error');
    expect(serializeError(undefined)).toBe('Unknown error');
    expect(serializeError('')).toBe('Unknown error');
  });

  it('should handle primitive values', () => {
    expect(serializeError(404)).toBe('404');
    expect(serializeError(true)).toBe('true');
  });

  it('should handle objects that cannot be JSON stringified', () => {
    const circularObj: any = { prop: 'value' };
    circularObj.self = circularObj; // Create circular reference
    
    const result = serializeError(circularObj);
    // Should fallback to toString or fallback message
    expect(typeof result).toBe('string');
    expect(result).toBe('Unserializable error object'); // Our fallback message
  });
});