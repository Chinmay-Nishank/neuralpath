export interface ScratchAlgorithm {
  id: string;
  title: string;
  category: 'Foundations' | 'Classical ML' | 'Deep Learning' | 'Transformers';
  level: 'beginner' | 'practitioner' | 'researcher';
  levelLabel: string;
  summary: string;
  mathFormula: string;
  explanation: string[];
  code: string;
  exercisePrompt: string;
  lessonUrl: string;
}

export const SCRATCH_ALGORITHMS: ScratchAlgorithm[] = [
  {
    id: 'linear-regression',
    title: 'Linear Regression & Vectorized Gradient Descent',
    category: 'Foundations',
    level: 'beginner',
    levelLabel: 'From Scratch: Level 1',
    summary:
      'Implements ordinary least squares regression using pure NumPy. Demonstrates analytical cost function computation, gradient calculation, and iterative parameter updates.',
    mathFormula: 'w \\leftarrow w - \\frac{\\alpha}{m} X^T (Xw - y)',
    explanation: [
      'Cost Function: Mean Squared Error (MSE) J(w) = (1 / 2m) * sum((Xw - y)^2).',
      'Analytical Gradient: dJ/dw = (1 / m) * X^T (Xw - y).',
      'Update Step: Step downhill opposite the gradient vector scaled by learning rate alpha.',
    ],
    code: `import numpy as np

# 1. Synthetic dataset: y = 2.5 * x + 4.0 + noise
np.random.seed(42)
m = 100
X_raw = 2 * np.random.rand(m, 1)
y = 2.5 * X_raw + 4.0 + 0.2 * np.random.randn(m, 1)

# Add bias column (X0 = 1)
X = np.c_[np.ones((m, 1)), X_raw]

# 2. Gradient Descent from Scratch
alpha = 0.1
iterations = 500
w = np.random.randn(2, 1)

losses = []
for epoch in range(iterations):
    predictions = X @ w
    errors = predictions - y
    loss = (1 / (2 * m)) * np.sum(errors ** 2)
    losses.append(loss)
    
    # Vectorized gradient calculation
    gradients = (1 / m) * (X.T @ errors)
    w = w - alpha * gradients

bias_learned, slope_learned = w[0, 0], w[1, 0]
print(f"Target: slope=2.5, bias=4.0")
print(f"Learned: slope={slope_learned:.4f}, bias={bias_learned:.4f}")
print(f"Final MSE Loss: {losses[-1]:.6f}")
`,
    exercisePrompt:
      'Try changing the learning rate alpha from 0.1 to 1.5. What happens to the loss? Notice how it oscillates and diverges if the step size overshoots the minimum.',
    lessonUrl: '/learn/foundations/01-what-is-a-model',
  },
  {
    id: 'logistic-regression',
    title: 'Logistic Regression & Binary Cross-Entropy',
    category: 'Classical ML',
    level: 'beginner',
    levelLabel: 'From Scratch: Level 2',
    summary:
      'Classifies binary data using the Sigmoid non-linearity and Binary Cross-Entropy (Log-Loss). Derives probability predictions and exact gradient flow.',
    mathFormula: '\\sigma(z) = \\frac{1}{1 + e^{-z}}, \\quad \\mathcal{L} = -\\frac{1}{m}\\sum [y\\log(\\hat{y}) + (1-y)\\log(1-\\hat{y})]',
    explanation: [
      'Sigmoid hypothesis: maps any real-valued logit z = Xw into a probability p in (0, 1).',
      'Negative Log-Likelihood: heavily penalizes confident incorrect classifications.',
      'Miraculous Gradient: the gradient of binary cross-entropy with sigmoid simplifies cleanly to (1/m) * X^T (y_hat - y).',
    ],
    code: `import numpy as np

def sigmoid(z):
    # Clip z to prevent numerical overflow in exp(-z)
    z_clipped = np.clip(z, -500, 500)
    return 1.0 / (1.0 + np.exp(-z_clipped))

# 1. Generate 2D binary classification clusters
np.random.seed(42)
m = 120
X_class0 = np.random.randn(m // 2, 2) + np.array([-1.5, -1.5])
X_class1 = np.random.randn(m // 2, 2) + np.array([1.5, 1.5])
X_raw = np.vstack([X_class0, X_class1])
y = np.vstack([np.zeros((m // 2, 1)), np.ones((m // 2, 1))])

# Add bias feature
X = np.c_[np.ones((m, 1)), X_raw]
w = np.zeros((3, 1))
lr = 0.2

for epoch in range(300):
    logits = X @ w
    p = sigmoid(logits)
    
    # Clip probabilities to prevent log(0)
    eps = 1e-15
    p_safe = np.clip(p, eps, 1.0 - eps)
    loss = -np.mean(y * np.log(p_safe) + (1 - y) * np.log(1 - p_safe))
    
    # Gradient of BCE loss
    grad = (1 / m) * (X.T @ (p - y))
    w -= lr * grad

# Evaluate training accuracy
preds = (sigmoid(X @ w) >= 0.5).astype(int)
accuracy = np.mean(preds == y) * 100
print(f"Converged BCE Loss: {loss:.4f}")
print(f"Classification Accuracy: {accuracy:.1f}%")
print(f"Decision Boundary weights: {w.ravel().round(3)}")
`,
    exercisePrompt:
      'Calculate the decision boundary line: set w0 + w1*x1 + w2*x2 = 0 and solve for x2 as a function of x1.',
    lessonUrl: '/learn/classical-ml/03-logistic-regression',
  },
  {
    id: 'micro-autograd',
    title: 'Micro-Autograd Engine (Reverse-Mode AD)',
    category: 'Deep Learning',
    level: 'practitioner',
    levelLabel: 'From Scratch: Level 3',
    summary:
      'A complete, minimalist reverse-mode automatic differentiation engine in pure Python. Tracks computation graphs and computes exact gradients via the chain rule.',
    mathFormula: '\\frac{\\partial L}{\\partial x} = \\sum_{y \\in \\text{children}(x)} \\frac{\\partial L}{\\partial y} \\cdot \\frac{\\partial y}{\\partial x}',
    explanation: [
      'Computational Graph: every Value node records its scalar data, accumulated gradient (.grad), and parent dependencies.',
      'Local Chain Rule: each primitive operation (+, *, relu) defines a backward lambda specifying how child gradients propagate upstream.',
      'Topological Sort: .backward() traverses nodes in reverse topological order, guaranteeing parent gradients are fully evaluated before child updates.',
    ],
    code: `class Value:
    def __init__(self, data, _children=()):
        self.data = float(data)
        self.grad = 0.0
        self._prev = set(_children)
        self._backward = lambda: None

    def __add__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        out = Value(self.data + other.data, (self, other))
        def _backward():
            self.grad += out.grad
            other.grad += out.grad
        out._backward = _backward
        return out

    def __mul__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        out = Value(self.data * other.data, (self, other))
        def _backward():
            self.grad += other.data * out.grad
            other.grad += self.data * out.grad
        out._backward = _backward
        return out

    def relu(self):
        out = Value(max(0.0, self.data), (self,))
        def _backward():
            self.grad += (1.0 if self.data > 0 else 0.0) * out.grad
        out._backward = _backward
        return out

    def backward(self):
        topo = []
        visited = set()
        def build_topo(v):
            if v not in visited:
                visited.add(v)
                for child in v._prev:
                    build_topo(child)
                topo.append(v)
        build_topo(self)
        self.grad = 1.0
        for node in reversed(topo):
            node._backward()

# Example: Compute dL/da, dL/db for L = relu(a * b + c)
a = Value(3.0)
b = Value(-2.0)
c = Value(10.0)
d = a * b        # -6.0
e = d + c        # 4.0
L = e.relu()     # 4.0

L.backward()
print(f"L.data: {L.data}")
print(f"dL/da: {a.grad} (expected: b.data = -2.0)")
print(f"dL/db: {b.grad} (expected: a.data = 3.0)")
print(f"dL/dc: {c.grad} (expected: 1.0)")
`,
    exercisePrompt:
      'Add a __sub__ or exp() method to the Value class with its corresponding chain-rule _backward lambda.',
    lessonUrl: '/learn/deep-learning/04-backpropagation',
  },
  {
    id: 'two-layer-mlp',
    title: '2-Layer MLP with Analytical Backprop',
    category: 'Deep Learning',
    level: 'practitioner',
    levelLabel: 'From Scratch: Level 4',
    summary:
      'Constructs a multi-layer neural network with a hidden ReLU layer and Softmax output. Derives full matrix backpropagation using only pure NumPy.',
    mathFormula: 'Z_1 = X W_1 + b_1, \\quad A_1 = \\text{ReLU}(Z_1), \\quad Z_2 = A_1 W_2 + b_2, \\quad \\hat{Y} = \\text{softmax}(Z_2)',
    explanation: [
      'Forward pass: Linear projection -> ReLU activation -> Linear projection -> Softmax probability distribution.',
      'Output gradient: dZ2 = (Y_hat - Y) / batch_size for Cross-Entropy combined with Softmax.',
      'Hidden gradient: dZ1 = (dZ2 @ W2.T) * (Z1 > 0), backpropagating through the ReLU activation mask.',
    ],
    code: `import numpy as np

np.random.seed(42)

# Non-linear XOR / circle dataset
m = 200
X = np.random.randn(m, 2)
y_labels = ((X[:, 0]**2 + X[:, 1]**2) > 1.0).astype(int)
Y = np.zeros((m, 2))
Y[np.arange(m), y_labels] = 1.0  # One-hot encoding

# Architecture: 2 inputs -> 8 hidden neurons (ReLU) -> 2 output classes
input_dim, hidden_dim, output_dim = 2, 8, 2
W1 = np.random.randn(input_dim, hidden_dim) * np.sqrt(2.0 / input_dim) # He init
b1 = np.zeros((1, hidden_dim))
W2 = np.random.randn(hidden_dim, output_dim) * np.sqrt(1.0 / hidden_dim)
b2 = np.zeros((1, output_dim))

lr = 0.1
for epoch in range(1000):
    # 1. Forward Pass
    Z1 = X @ W1 + b1
    A1 = np.maximum(0, Z1) # ReLU
    Z2 = A1 @ W2 + b2
    # Softmax with numerical stability shift
    exp_scores = np.exp(Z2 - np.max(Z2, axis=1, keepdims=True))
    probs = exp_scores / np.sum(exp_scores, axis=1, keepdims=True)
    
    loss = -np.mean(np.sum(Y * np.log(probs + 1e-12), axis=1))
    
    # 2. Backward Pass
    dZ2 = (probs - Y) / m
    dW2 = A1.T @ dZ2
    db2 = np.sum(dZ2, axis=0, keepdims=True)
    
    dA1 = dZ2 @ W2.T
    dZ1 = dA1 * (Z1 > 0) # ReLU derivative
    dW1 = X.T @ dZ1
    db1 = np.sum(dZ1, axis=0, keepdims=True)
    
    # 3. Parameter Update
    W1 -= lr * dW1
    b1 -= lr * db1
    W2 -= lr * dW2
    b2 -= lr * db2

preds = np.argmax(probs, axis=1)
acc = np.mean(preds == y_labels) * 100
print(f"Final Cross-Entropy Loss: {loss:.4f}")
print(f"MLP Accuracy on Non-Linear Ring: {acc:.1f}%")
`,
    exercisePrompt:
      'What happens if you initialize W1 and W2 with all zeros instead of random Gaussian weights? (Symmetry breaking fails and hidden units learn identical features).',
    lessonUrl: '/learn/deep-learning/01-perceptron-to-mlp',
  },
  {
    id: 'scaled-dot-product-attention',
    title: 'Scaled Dot-Product Attention & Causal Masking',
    category: 'Transformers',
    level: 'practitioner',
    levelLabel: 'From Scratch: Level 5',
    summary:
      'Implements the core Transformer attention engine from "Attention Is All You Need" in NumPy. Includes query-key dot product scaling and autoregressive causal masking.',
    mathFormula: '\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{Q K^T}{\\sqrt{d_k}} + M\\right) V',
    explanation: [
      'Compatibility score: computes pairwise semantic similarity between query vectors and key vectors via Q @ K^T.',
      'Variance Normalization: dividing by sqrt(d_k) prevents logits from saturating softmax when dimensions scale.',
      'Causal Mask: in autoregressive decoders, positions j > i are masked with -infinity so tokens cannot peek into future timesteps.',
    ],
    code: `import numpy as np

def scaled_dot_product_attention(Q, K, V, causal_mask=True):
    """
    Q: (batch, seq_len, d_k)
    K: (batch, seq_len, d_k)
    V: (batch, seq_len, d_v)
    """
    d_k = Q.shape[-1]
    
    # 1. Compute raw affinity scores (Q @ K.T)
    scores = (Q @ np.swapaxes(K, -1, -2)) / np.sqrt(d_k)
    
    # 2. Apply causal mask (lower triangular)
    if causal_mask:
        seq_len = Q.shape[1]
        # Upper triangular mask (excluding diagonal)
        mask = np.triu(np.ones((seq_len, seq_len), dtype=bool), k=1)
        scores = np.where(mask, -1e9, scores)
    
    # 3. Numerically stable Softmax
    scores_shifted = scores - np.max(scores, axis=-1, keepdims=True)
    exp_scores = np.exp(scores_shifted)
    attention_weights = exp_scores / np.sum(exp_scores, axis=-1, keepdims=True)
    
    # 4. Contextual value projection
    output = attention_weights @ V
    return output, attention_weights

# Test with sequence of 4 tokens (e.g., ["Thinking", "Machines", "Learn", "Fast"])
np.random.seed(1337)
batch_size, seq_len, d_k = 1, 4, 8
Q = np.random.randn(batch_size, seq_len, d_k)
K = np.random.randn(batch_size, seq_len, d_k)
V = np.random.randn(batch_size, seq_len, d_k)

out, weights = scaled_dot_product_attention(Q, K, V, causal_mask=True)

print("Attention Output Shape:", out.shape)
print("Attention Weights Matrix (first sample):")
np.set_printoptions(precision=3, suppress=True)
print(weights[0])
print("\\nNotice: Row 0 attends only to token 0 (1.000). Future tokens are masked to 0.000!")
`,
    exercisePrompt:
      'Disable the causal mask by setting causal_mask=False. Notice how token 0 can now attend bidirectionally to tokens 1, 2, and 3 (BERT-style encoder attention).',
    lessonUrl: '/learn/nlp-transformers/04-self-attention',
  },
  {
    id: 'bpe-tokenizer',
    title: 'Byte Pair Encoding (BPE) Tokenizer',
    category: 'Transformers',
    level: 'practitioner',
    levelLabel: 'From Scratch: Level 6',
    summary:
      'Builds the subword tokenization algorithm used by GPT and modern LLMs. Iteratively extracts adjacent character pair frequencies and merges the most frequent pairs into vocab tokens.',
    mathFormula: '(p_1, p_2)^* = \\arg\\max_{p} \\text{freq}(p_1, p_2)',
    explanation: [
      'Character-level initialization: words are initially split into individual characters followed by end-of-word markers.',
      'Frequency extraction: counts every adjacent bigram across the training corpus.',
      'Greedy merge: iteratively replaces the highest frequency pair with a new merged subword symbol.',
    ],
    code: `import collections

def get_stats(vocab):
    pairs = collections.defaultdict(int)
    for word, freq in vocab.items():
        symbols = word.split()
        for i in range(len(symbols) - 1):
            pairs[(symbols[i], symbols[i + 1])] += freq
    return pairs

def merge_vocab(pair, v_in):
    v_out = {}
    bigram = ' '.join(pair)
    replacement = ''.join(pair)
    for word in v_in:
        # Replace occurrences of pair with merged symbol
        w_out = word.replace(bigram, replacement)
        v_out[w_out] = v_in[word]
    return v_out

# Corpus with repeated morphological patterns
corpus = [
    "low low low low low",
    "lower lower lower",
    "newest newest newest newest",
    "widest widest",
]

# Initialize vocabulary with character spaces
raw_vocab = collections.Counter(" ".join(corpus).split())
vocab = {" ".join(list(word)) + " </w>": freq for word, freq in raw_vocab.items()}

print("Initial Vocabulary:")
for k, v in vocab.items():
    print(f"  {k}: {v}")

num_merges = 6
print(f"\\nExecuting {num_merges} BPE merges:")
for i in range(num_merges):
    pairs = get_stats(vocab)
    if not pairs:
        break
    best_pair = max(pairs, key=pairs.get)
    vocab = merge_vocab(best_pair, vocab)
    print(f"  Step {i+1}: merged {best_pair} (occurred {pairs[best_pair]} times)")

print("\\nVocabulary After Merges:")
for k, v in vocab.items():
    print(f"  {k}: {v}")
`,
    exercisePrompt:
      'Why is BPE superior to word-level tokenization for unseen out-of-vocabulary (OOV) words? (Any novel word can always be decomposed into constituent subwords or single characters).',
    lessonUrl: '/learn/nlp-transformers/01-tokenization-bpe',
  },
];

export function getScratchAlgorithmById(id: string): ScratchAlgorithm | undefined {
  return SCRATCH_ALGORITHMS.find((a) => a.id === id);
}

