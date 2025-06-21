function visualize() {
  const input = document.getElementById("codeInput").value;
  const lines = input.split("\n");
  const classes = [];
  let currentClass = null;
  let access = "public";
  let inside = false;

  lines.forEach(line => {
    line = line.trim();
    if (line.startsWith("class")) {
      const parts = line.replace("{", "").trim().split(" ");
      const name = parts[1];
      const parent = (parts.length > 3 && parts[2] === ":") ? parts[3] : null;
      currentClass = { name, parent, attributes: [], methods: [], composed: [], concepts: [] };
      if (parent) currentClass.concepts.push("Inheritance");
      inside = true;
    } else if (line === "}") {
      if (currentClass) classes.push(currentClass);
      currentClass = null;
      inside = false;
    } else if (inside && currentClass) {
      if (line.endsWith(":") && (line === "public:" || line === "private:" || line === "protected:")) {
        access = line.replace(":", "");
      } else if (line.endsWith(";")) {
        const clean = line.replace(";", "").trim();
        const isMethod = clean.includes("(");
        const item = { text: clean, access, badge: "" };

        if (isMethod) {
          if (clean.includes("= 0")) {
            item.badge = "Abstract";
            currentClass.concepts.push("Abstraction");
          }
          if (clean.includes("override")) {
            item.badge = "Override";
            currentClass.concepts.push("Polymorphism");
          }
          if (clean.includes("virtual") && !item.badge.includes("Override")) {
            item.badge = "Virtual";
          }
          if (clean.includes("static")) {
            item.badge = "Static";
          }
          if (clean.includes(currentClass.name + "(")) {
            item.badge = "Constructor";
          }
          if (clean.includes("~" + currentClass.name + "(")) {
            item.badge = "Destructor";
          }
          currentClass.methods.push(item);
        } else {
          currentClass.attributes.push(item);
        }
      }
    }
  });

  // Detect composition
  classes.forEach(cls => {
    cls.attributes.forEach(attr => {
      classes.forEach(other => {
        if (attr.text.includes(other.name) && other.name !== cls.name) {
          cls.composed.push(other.name);
          cls.concepts.push("Composition");
        }
      });
    });
  });

  const output = document.getElementById("output");
  output.innerHTML = '';
  document.getElementById("svg-arrows").innerHTML = '';

  classes.forEach(cls => {
    const box = document.createElement("div");
    box.className = "class-box";
    box.id = "class-" + cls.name;

    let html = `<strong>${cls.name}</strong>`;

    const uniqueConcepts = [...new Set(cls.concepts)];
    uniqueConcepts.forEach(concept => {
      html += `<div class="oop-tag">${concept}</div>`;
    });

    if (cls.attributes.length > 0) {
      html += '<div class="attributes"><b>Attributes:</b><ul>';
      cls.attributes.forEach(a => html += `<li>${a.access}: ${a.text}</li>`);
      html += '</ul></div>';
    }

    if (cls.methods.length > 0) {
      html += '<div class="methods"><b>Methods:</b><ul>';
      cls.methods.forEach(m => {
        const badge = m.badge ? `<span class="badge">${m.badge}</span>` : '';
        html += `<li>${m.access}: ${m.text} ${badge}</li>`;
      });
      html += '</ul></div>';
    }

    box.innerHTML = html;
    output.appendChild(box);
  });

  drawArrows(classes);
}

function drawArrows(classes) {
  const svg = document.getElementById("svg-arrows");
  const ns = "http://www.w3.org/2000/svg";

  classes.forEach(cls => {
    const fromBox = document.getElementById("class-" + cls.name);
    if (cls.parent) {
      const toBox = document.getElementById("class-" + cls.parent);
      if (fromBox && toBox) drawLine(fromBox, toBox, svg, ns, "inherit");
    }
    cls.composed.forEach(comp => {
      const toBox = document.getElementById("class-" + comp);
      if (fromBox && toBox) drawLine(fromBox, toBox, svg, ns, "compose");
    });
  });
}

function drawLine(fromBox, toBox, svg, ns, type) {
  const f = fromBox.getBoundingClientRect();
  const t = toBox.getBoundingClientRect();

  const line = document.createElementNS(ns, "line");
  line.setAttribute("x1", f.left + f.width / 2);
  line.setAttribute("y1", f.top);
  line.setAttribute("x2", t.left + t.width / 2);
  line.setAttribute("y2", t.bottom);
  line.setAttribute("stroke", type === "inherit" ? "#007bff" : "#28a745");
  line.setAttribute("stroke-width", "2");
  if (type === "compose") {
    line.setAttribute("stroke-dasharray", "4");
  }
  svg.appendChild(line);
}

function toggleTheme() {
  document.body.classList.toggle("dark");
}